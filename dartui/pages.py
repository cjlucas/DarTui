import os
import sys
import web
import rtorrent
import time
import random
import simplejson as json
from urlparse import parse_qs
from gzip import GzipFile
from StringIO import StringIO

#from actions import build_torrent_info, perform_torrent_action
import actions
import common
import formatters
import sql
import utils
import http

render = http.render
to_json = utils.to_json

def process_output(data):
    """process data for browser, include headers"""
    f = StringIO()
    if isinstance(data, web.template.TemplateResult):
        data = data["__body__"]
    if "gzip" in web.ctx.env.get("HTTP_ACCEPT_ENCODING", ""):
        web.header("Content-encoding", "gzip")
        g = GzipFile(fileobj=f, mode="wb")
        g.write(data)
        g.close()
    else:
        f.write(data)
    
    f.seek(0)
    return(f.read())

class Index:
    def GET(self):
        if common.conf.settings["show_welcome"]:
            raise(web.seeother("/welcome"))
        else:
            return(process_output(render.index(GetTorrents().main(), GetSettings().main())))
        
class Welcome:
    def GET(self):        
        return(process_output(render.welcome()))
        
class SetSettings:
    def POST(self):
        args = web.input()
        settings = {}
        for key, data_type in sql.tables["settings"].default_types.items():
            if data_type == bool:
                # for options that use checkboxes (bool types)
                # if they're unchecked, the key won't be in args
                # if checked, the key will be in args with the value of "checked" or "on"
                if key in args and args[key] in ("checked", "on"):
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
    def main(self):
        #db = common.conf.get_db(sql.tables["settings"])
        settings = common.conf.settings
        #db.close()
        # remove sensitive info
        if settings["password"] is not None:
            settings["password"] = "*" * len(settings["password"])
        return(to_json(settings))
        
    def GET(self):
        """ only call process_output() if data is being sent to immediately to browser"""
        return(process_output(self.main()))

class GetTorrents:
    def main(self):
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
            rt.update()
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
                try:
                    du = utils.get_disk_usage(common.conf.settings["du_path"])
                except OSError:
                    print("{0} not found".format(common.conf.settings["du_path"]))
                    du = utils.get_disk_usage("/")
                    
                json_data["torrents"] = actions.build_torrent_info(torrents)        
            
                json_data["client_info"]["disk_free_str"] = formatters.format_size(du.free)
                json_data["client_info"]["disk_total_str"] = formatters.format_size(du.total)
                json_data["client_info"]["disk_free_percentage"] = formatters.format_percentage(du.free, du.total)
                json_data["client_info"]["down_rate"] = formatters.format_speed(rt.down_rate)
                json_data["client_info"]["up_rate"] = formatters.format_speed(rt.up_rate)
                json_data["client_info"]["client_version"] = rt.client_version
                json_data["client_info"]["library_version"] = rt.library_version
                json_data["client_info"]["dartui_version"] = common.__version__
                json_data["client_info"]["recent_torrent_dests"] = common.recent_torrent_dests
        else:
            json_data["error_code"] = 1
            json_data["error_msg"] = "Couldn't connect to rTorrent."
      
        return(to_json(json_data))
        
    def GET(self):
        """only call process_output() if data is being sent to immediately to browser"""
        return(process_output(self.main()))
        
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
        return(process_output(to_json(json_data)))
        
        
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
        return(process_output(to_json(conn_status)))
        
class FileUploadTest:
    def GET(self):
        return(render.fileupload())

class FileUploadAction:
    def POST(self):
        rdata = {}
        rdata["success"] = True
        rdata["err_msg"] = ""
        args = web.input()
        files = []
        
        # get user's destination choice
        if args["dest_choice"] == "text":
            dest_path = args["dest_path_text"]
        elif args["dest_choice"] == "recents":
            dest_path = args["dest_path_select"]
        
        try:
            files = web.webapi.rawinput()["files"]
            if not isinstance(files, list): files = [files] # when only one file is uploaded
        except:
            rdata["success"] = False
            rdata["err_msg"] = "No files added"
            
        if not common.conf.is_local() or os.path.exists(dest_path): # only validate upload_dir if is_local() is true
            if dest_path != common.conf.settings["dest_path"]: # don't add if using default upload path
                 actions.add_recent_torrent_dest(dest_path)
            
            for f in files:
                actions.handle_uploaded_file(f, dest_path)
        else:
            rdata["success"] = False
            rdata["err_msg"] = "Destination not found"
            
        return(process_output(to_json(rdata)))
