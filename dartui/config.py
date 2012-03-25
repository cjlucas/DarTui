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
        
        self.refresh()
        
        self.table_versions = self.get_table_versions()

    def get_table_versions(self):
        table_versions = {}
        db = self.get_db(sql.tables["table_versions"])
        for row in db.get_table_contents():
            table_versions[row["name"]] = row["version"]
        return(table_versions)

    def has_db_conn(self):
        if self.db_conn is not None: return(True)
        else: return(False)
        
    def _set_default_values(self):
        self.settings = {}
        self.rt = None
        
    def update_settings(self, settings):
        settings["show_welcome"] = False # no need to show welcome screen after user has updated settings
        db = self.get_db(sql.tables["settings"])
        db.update_table_contents(settings)
        self.settings = db.get_table_contents()
        
    def refresh(self):
        self._set_default_values()
        
        db = self.get_db(sql.tables["settings"])
        self.settings = db.get_table_contents()
        
        self.get_rt_connection()
        
    def get_rt_url(self):
        self.rt_url = utils.build_url(
                        self.settings["host"],
                        self.settings["port"],
                        self.settings["username"],
                        self.settings["password"],
                        )
                        
        return(self.rt_url)
        
    def get_rt_connection(self):
        self.rt = utils.get_rtorrent_connection(self.get_rt_url())
        self.tracker_cache = {}
        self.old_torrent_cache = []
        self.torrent_cache = []
        return(self.rt)
        
    def get_db(self, table_obj=None):
        return(sql.Database(self.db_path, table_obj))
    
    def get_rt(self):
        return(self.rt)