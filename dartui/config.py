import os

import sql
import common
import utils
import actions

class ConfigDir:
    def __init__(self, config_path):
        self.config_path = os.path.abspath(config_path)
        if not os.path.isdir(self.config_path): os.makedirs(self.config_path)
        self._create_dirs()
        
        self.db_name = "dartui.db"
        self.db_path = os.path.join(self.config_path, self.db_name)
        
        self.refresh()
        
        # quick and dirty way to see if config file is using the old db system from v1.0.0
        # (this can be removed sometime in the distant future)
        db = self.get_db()
        tables = db._get_tables()
        if "settings" in tables and "table_versions" not in tables:
            print("old db style found, update settings table")
            update_settings_table = True
        else:
            update_settings_table = False
        
        self.table_versions = self.get_table_versions()
        
        # check if tables are up to date, and update them if not
        for table in sql.tables:
            if table != "table_versions" and table in self.table_versions: # already handled by get_table_versions
                db = self.get_db(sql.tables[table]) # this will create the table if it doesn't already exist
                if sql.tables[table].version > self.table_versions[table]: db.update_table_struct()
                elif table == "settings" and update_settings_table: db.update_table_struct()
                
    def _create_dirs(self):
        DIRS = ("torrent_cache",)
        for d in DIRS:
            dpath = os.path.join(self.config_path, d)
            if not os.path.isdir(dpath): 
                print("creating dir: {0}".format(dpath))
                os.mkdir(dpath)

    def get_table_versions(self):
        table_versions = {}
        db = self.get_db(sql.tables["table_versions"])
        db.insert_defaults() # insert new tables (if any)
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
        
        self.refresh()
        
    def refresh(self):
        self._set_default_values()
        
        db = self.get_db(sql.tables["settings"])
        self.settings = db.get_table_contents()
        
        self.get_rt_connection()
        
        # get rt specific settings
        if self.rt is not None:
            self.settings["dest_path"] = self.rt.directory
            self.settings["upload_rate"] = self.rt.upload_rate
            self.settings["download_rate"] = self.rt.download_rate
        
    def get_rt_url(self):
        self.rt_url = utils.build_url(
                        self.settings["host"],
                        self.settings["port"],
                        self.settings["username"],
                        self.settings["password"],
                        )
                        
        return(self.rt_url)
        
    def get_rt_connection(self): # TODO: rename this
        self.rt = utils.get_rtorrent_connection(self.get_rt_url())
        self.tracker_cache = {}
        self.old_torrent_cache = []
        self.torrent_cache = []
        return(self.rt)
        
    def get_db(self, table_obj=None):
        return(sql.Database(self.db_path, table_obj))
    
    def get_rt(self):
        return(self.rt)
        
    def is_local(self):
        """Checks if DarTui is running on the same system as rtorrent"""
        VALID_LOCAL_ADDRS = ("localhost", "127.0.0.1", "0.0.0.0")
        return(self.settings["host"].lower() in VALID_LOCAL_ADDRS)