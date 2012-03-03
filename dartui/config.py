import os

import sql
import common
import utils

class ConfigDir:
    def __init__(self, config_path):
        self.config_path = os.path.abspath(config_path)
        if not os.path.isdir(self.config_path): os.makedirs(self.config_path)
        
        self.db_name = "dartui.db"
        self.db_path = os.path.join(self.config_path, self.db_name)
        
        self._insert_default_db_values()
        self.refresh()
        
    def _insert_default_db_values(self):
        db = self.get_db()
        db._insert_default_values()
        
    def has_db_conn(self):
        if self.db_conn is not None: return(True)
        else: return(False)
        
    def set_db_exists(self):
        if os.path.isfile(self.db_path): self.db_exists = True
        else: self.db_exists = False
        
    def _set_default_values(self):
        self.db_exists = False
        self.rt_settings = {}
        self.rt = None
        
    def update_settings(self, settings):
        db = self.get_db()
        db.update_settings(**settings)
        
    def refresh(self):
        self._set_default_values()
        
        self.set_db_exists()
        if not self.db_exists:
            # if database is new, create tables
            db = self.get_db()
            db.create_tables()
            db.close()
        
        self.get_rt_settings()
        self.get_rt_connection()
        
    def get_rt_settings(self):
        db = self.get_db()
        settings = db.query("SELECT * from settings")
        for s in settings: self.rt_settings[s[0].encode()] = s[1]
            
        self.rt_url = utils.build_url(
                        self.rt_settings["host"],
                        self.rt_settings["port"],
                        self.rt_settings["username"],
                        self.rt_settings["password"],
                        )
        db.close()
        
    def get_rt_connection(self):
        self.rt = utils.get_rtorrent_connection(self.rt_url)
        self.tracker_cache = {}
        self.old_torrent_cache = []
        self.torrent_cache = []
        return(self.rt)
        
    def get_db(self):
        return(sql.Database(self.db_path))
    
    def get_rt(self):
        return(self.rt)