import os
import sys
import web
import rtorrent
import time
import random
import simplejson as json
from urlparse import parse_qs

#from actions import build_torrent_info, perform_torrent_action
import actions
import common
import formatters
import sql
import utils

render = common.render
to_json = utils.to_json

class Index:
    def GET(self):
        db = common.conf.get_db()
        if db.settings["show_welcome"]:
            raise(web.seeother("/welcome"))
        else:
            return(render.index(GetTorrents().GET(), GetSettings().GET()))
        
class Welcome:
    def GET(self):        
        return(render.welcome())
        
class SetSettings:
    def POST(self):
        args = web.input()
        #print(args)
        settings = {}
        #print(args.items())
        for key, data_type in sql.Database.DATA_TYPES.items():
            if data_type == bool:
                # for options that use checkboxes (bool types)
                # if they're unchecked, the key won't be in args
                # if checked, the key will be in args with the value of "checked"
                if key in args and args[key] == "checked":
                    settings[key] = True
                else:
                    settings[key] = False
            elif data_type == None:
                if args[key] == "":
                    settings[key] = None
                else:
                    settings[key] = args[key]
            else:
                if key in args:
                    settings[key] = args[key]
                    
                    
        # dont send password if censored
        if args.has_key("password") and len(args["password"]) > 0:
            if args["password"] == "*" * len(args["password"]):
                del settings["password"]
                
        #print(settings)
        
        db = common.conf.get_db()
        
        common.conf.update_settings(settings)
        db.close()
        common.conf.refresh() # refresh conf info        
        
        raise(web.seeother("/"))
        
class GetSettings:
    def GET(self):
        db = common.conf.get_db()
        settings = db.get_settings()
        db.close()
        # remove sensitive info
        if settings["password"] is not None:
            settings["password"] = "*" * len(settings["password"])
        return(to_json(settings))

class GetTorrents:
    def GET(self):
        args = web.input()
        rpc_ids = args.get("rpc_id", None)
        rt = common.conf.get_rt()
        json_data = {}
        json_data["torrents"] = []
        json_data["client_info"] = {}
        json_data["trackers"] = {}
        json_data["error_code"] = 0
        json_data["error_msg"] = ""
        
        if rt is not None:
            try:
                rt.update()
            except: # workaround for httplib.ResponseNotReady
                pass
            torrents = actions.get_torrents_and_update_cache()
            json_data["trackers"] = common.conf.tracker_cache
            
            # if specific rpc ids were specified
            if rpc_ids is not None:
                #rpc_ids = parse_qs(rpc_ids).get("ids", []) # not needed?
                if isinstance(rpc_ids, (str, unicode)): rpc_ids = [rpc_ids]
            
                for rpc_id in rpc_ids:
                    t = actions.get_torrent(rpc_id)
                    json_data["torrents"].append(actions.build_torrent_info(t))
        
            else:
                # return all torrents (plus extra info)
                json_data["torrents"] = actions.build_torrent_info(torrents)        
            
                du = utils.get_disk_usage("/")
                json_data["client_info"]["disk_free_str"] = formatters.format_size(du.free)
                json_data["client_info"]["disk_total_str"] = formatters.format_size(du.total)
                json_data["client_info"]["disk_free_percentage"] = formatters.format_percentage(du.free, du.total)
                json_data["client_info"]["down_rate"] = formatters.format_speed(rt.down_rate)
                json_data["client_info"]["up_rate"] = formatters.format_speed(rt.up_rate)
                json_data["client_info"]["client_version"] = rt.client_version
                json_data["client_info"]["library_version"] = rt.library_version
                json_data["client_info"]["dartui_version"] = common.__version__
        else:
            json_data["error_code"] = 1
            json_data["error_msg"] = "Could not connect to rTorrent instance."
      
        return(to_json(json_data))
        
class TorrentAction:
    def GET(self):
        args = web.input()
        print(args)
        mode = args.get("mode", None)
        rpc_ids = args.get("rpc_ids", None)
        json_data = {}
        if mode is not None: mode = mode.lower()
        
        if rpc_ids is not None:
            deserialized_data = utils.deserialize_args(rpc_ids)
            #print("deserialized_data = " + deserialized_data)
            #print(rpc_ids)
            if isinstance(deserialized_data, (str, unicode)):
                rpc_ids = [rpc_ids]
            elif isinstance(deserialized_data, dict):
                rpc_ids = deserialized_data.get("row_checkbox", [])
            
            print("rpc_ids = {0}".format(rpc_ids))
            if mode in ["start", "stop", "rehash"]:
                json_data = actions.start_stop_rehash_torrents(mode, rpc_ids)
            elif mode == "delete":
                #json_data = actions.delete_torrents(rpc_ids)
                actions.delete_torrents(rpc_ids)
                return(GetTorrents().GET())
                
            
        print(json_data)
        return(to_json(json_data))
        
        
class TestConnection:
    def POST(self):
        args = web.input()
        print(args)
        host = args.get("host", None)
        port = args.get("port", 80)
        username = args.get("username", None)
        password = args.get("password", None)
        
        url = utils.build_url(host, port, username, password)
        conn_status = utils.test_xmlrpc_connection(url)
        return(to_json(conn_status))
