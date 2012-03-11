import sys

import common
import config
import actions

__version__ = "1.0.0"
__author__ = "Chris Lucas"
__contact__ = "chris@chrisjlucas.com"
__license__ = "MIT"

common.__version__ = __version__

def run(conf_dir, http_ip, http_port):
    common.conf = config.ConfigDir(conf_dir)
    if common.conf.get_rt() is not None:
        print("Filling torrent cache. May take some time.")
        actions.get_torrents_and_update_cache()
        print("Caching complete, starting server.")
        
        
    import http
    http.run_server(http_ip, http_port)
