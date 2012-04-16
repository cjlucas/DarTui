import os
import time
import rtorrent

import formatters
import common
import utils
import sql

to_json = utils.to_json

def build_torrent_info(torrent_list):
    ret_list = []
    cur_time = time.time()
    
    if not isinstance(torrent_list, list):
        torrent_list = [torrent_list]
        
    for t in torrent_list:
        if os.path.exists(t.base_path): 
            ctime = os.stat(t.base_path).st_ctime
            time_added = formatters.format_time_difference(cur_time - ctime)
        else:
            ctime = 0
            time_added = "NOT FOUND"
            
        eta = formatters.calc_eta(t.down_rate, t.left_bytes)
            
        torrent_dict = {
            "rpc_id"            : t.rpc_id,
            "name"              : t.name,
            "message"           : t.message,
            "ctime"             : ctime,
            "up_rate"           : t.up_rate,
            "up_rate_str"       : formatters.format_speed(t.up_rate),
            "down_rate"         : t.down_rate,
            "down_rate_str"     : formatters.format_speed(t.down_rate),
            "ratio"             : formatters.format_ratio(t.ratio),
            "total_bytes"       : t.size_bytes,
            "total_str"         : formatters.format_size(t.size_bytes),
            "left_bytes"        : t.left_bytes,
            "completed_bytes"   : t.completed_bytes,
            "completed_str"     : formatters.format_size(t.completed_bytes),
            "percent_complete"  : formatters.format_percentage(t.completed_bytes, t.size_bytes),
            "state"             : t.state,
            "active"            : t.active,
            "hashing"           : t.hash_checking,
            "hashing_queued"    : t.hash_checking_queued,
            "peers_connected"   : t.peers_connected,
            "total_peers"       : t.peers_connected + t.peers_not_connected,
            "time_added"        : time_added,
            "eta"               : eta,
            "eta_str"           : formatters.format_time_difference(eta),
        }
        ret_list.append(torrent_dict)

    if len(ret_list) == 1: return(ret_list[0])
    else: return(ret_list)
    
def start_stop_rehash_torrents(mode, rpc_ids):
    torrents = []
    rt = common.conf.get_rt()
    m = rtorrent.rpc.Multicall(rt)
    for rpc_id in rpc_ids:
        t = get_torrent(rpc_id)
        if t is not None: 
            if mode == "start": t.multicall_add(m, "d.try_start")
            elif mode == "stop": t.multicall_add(m, "d.try_stop")
            elif mode == "rehash": t.multicall_add(m, "d.check_hash")
        
    m.call()
    rt.get_torrents()
    # only send data back for torrents that were actually modified
    for rpc_id in rpc_ids:
        t = get_torrent(rpc_id)
        if t is not None: torrents.append(build_torrent_info(t))
    
    return(torrents)
    
def delete_torrents(rpc_ids):
    output_dict = {}
    rt = common.conf.get_rt()
    m = rtorrent.rpc.Multicall(rt)
    
    for rpc_id in rpc_ids:
        t = get_torrent(rpc_id)
        if t is not None:
            t.multicall_add(m, "d.erase")
            
    m.call()

    #for rpc_id, ret_code in zip(rpc_ids, m.call()):
    #    output_dict[rpc_id] = ret_code
    rt.get_torrents()
    #return(build_torrent_info(rt.torrents))    
    
def perform_torrent_action(mode, rpc_ids):
    status_dict = {}
    
    if isinstance(rpc_ids, str):
        rpc_ids = [rpc_ids]
    
    for rpc_id in rpc_ids:
        t = get_torrent(rpc_id)
        if t is not None:
            if mode == "start":
                status_dict[rpc_id] = t.start()
            elif mode == "stop":
                status_dict[rpc_id] = t.stop()
            elif mode == "delete":
                status_dict[rpc_id] = t.delete()
    
    return(status_dict)
            
def get_torrents_and_update_cache():
    rt = common.conf.get_rt()
    if rt is not None:
        common.conf.old_torrent_cache = common.conf.torrent_cache
        common.conf.torrent_cache = rt.get_torrents()
        manage_tracker_cache()
    return(common.conf.torrent_cache)
    
def manage_tracker_cache():
    old_rpcids = [t.rpc_id for t in common.conf.old_torrent_cache]
    new_rpcids = [t.rpc_id for t in common.conf.torrent_cache]
    # check for new torrents
    for torrent in common.conf.torrent_cache:
        if torrent.rpc_id not in old_rpcids:
            for t in torrent.get_trackers():
                url = formatters.strip_url(t.url)
                if url is not None:
                     if url not in common.conf.tracker_cache: common.conf.tracker_cache[url] = []
                     common.conf.tracker_cache[url].append(torrent.rpc_id)
    
    # check if torrents have been removed
    for torrent in common.conf.old_torrent_cache:
        if torrent.rpc_id not in new_rpcids:
            for t in torrent.trackers: 
                url = formatters.strip_url(t.url)
                if url is not None: common.conf.tracker_cache[url].remove(torrent.rpc_id)
    
    # cleanup cache
    for tracker in common.conf.tracker_cache.keys():
        if common.conf.tracker_cache[tracker] == []:
            del common.conf.tracker_cache[tracker]
            
def get_torrent(rpc_id):
    rt = common.conf.get_rt()
    t = rtorrent.common.find_torrent(rpc_id, rt.torrents)
    if t != -1: return(t)
    else: return(None)

def save_torrent_file(tf):
    torrent_cache_dir = os.path.join(common.conf.config_path, "torrent_cache")
    torrent_filename = "{0}.{1}.torrent".format(
        os.path.splitext(utils.safe_filename(tf.name))[0],
        tf.info_hash)
        
    torrent_file_abspath = os.path.join(torrent_cache_dir, torrent_filename)
    if not os.path.exists(torrent_file_abspath):
        with open(torrent_file_abspath, "wb") as fp:
            tf.seek(0)
            fp.write(tf.read())
            
def load_torrent(tf, dest_path):
    rt = common.conf.get_rt()
    
    t = rt.load_torrent(tf.read(), start=False)
    t.set_directory(dest_path)
    t.start()
    
    return(t)
        
def handle_uploaded_file(f, dest_path):
    """
    Inputs:
      f -- cgi.FileStorage object
      upload_dir -- directory where the torrent will download
    """
    torrent_files = utils.get_torrent_files(f)

    for tf in torrent_files:
        load_torrent(tf, dest_path)
        save_torrent_file(tf)
        tf.close()
        
        
def add_recent_torrent_dest(d):
    directory = d.rstrip(os.sep)
    db = common.conf.get_db(sql.tables["recent_torrent_dests"])
    db.delete_rows(path=directory)
    db.insert_row(path=directory)
    db.close()
    
    # update recent upload dirs
    common.recent_torrent_dests = get_recent_torrent_dests()
    
def get_recent_torrent_dests():
    db = common.conf.get_db(sql.tables["recent_torrent_dests"])
    rows = db.query("SELECT * FROM recent_torrent_dests ORDER BY id DESC LIMIT 0,10")
    db.close()
    
    return([r["path"] for r in rows])
