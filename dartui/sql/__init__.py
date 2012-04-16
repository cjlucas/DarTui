import sqlite3
import gzip
import os
import time
import web

import converters

SQL_SCRIPTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "scripts/"))

class Table(object):
    def __init__(self, name, version, **kwargs):
        self.name = name
        self.version = version
        self.preserve_data = kwargs.get("preserve_data", False) # preserve data if table struct is updated
        self.default_values = kwargs.get("default_values", {})
        self.default_types = kwargs.get("default_types", {})
        
        self.struct_file = self.get_script_file("struct")
        self.defaults_file = self.get_script_file("defaults")
        
        
    def _is_file_compressed(self, f):
        return(f.endswith(".gz") or f.endswith(".gzip"))
        
    def _get_script_contents(self, filename):
        if self._is_file_compressed(filename): return(gzip.open(filename, "r").read())
        else: return(open(filename, "r").read())
        
    def get_create_table_query(self):
        sql_method = "_executescript"
        assert self.struct_file is not None, "struct file not found"
        return(sql_method, (self._get_script_contents(self.struct_file),))
    
    def get_insert_defaults_query(self):
        if self.defaults_file is not None:
            sql_method = "_executescript"
            data = self._get_script_contents(self.defaults_file)
            return(sql_method, (data,))
        elif self.default_values != {}:
            sql_method = "_executemany"
            query = "INSERT OR IGNORE INTO {0} VALUES (?, ?)".format(self.name)
            args = self.default_values.items()
            return(sql_method, (query, args))
        else:
            # if no defaults found, just return None
            return(None)
    
    def process_results(self, data):
        return(data)
        
    def get_script_file(self, ext):
        possible_filenames = [self.name + "." + ext]
        # support compressed files
        possible_filenames_incl_compression = []
        for filename in possible_filenames:
            possible_filenames_incl_compression.append(filename)
            possible_filenames_incl_compression.append(filename + ".gz")
            possible_filenames_incl_compression.append(filename + ".gzip")
            
        possible_filenames = possible_filenames_incl_compression
        del possible_filenames_incl_compression
            
        for filename in possible_filenames:
            full_path = os.path.join(SQL_SCRIPTS_DIR, filename)
            if os.path.isfile(full_path):
                return(full_path)
                
        return(None)
        
class KeyValueTable(Table):
    """Use this class for a table that use key-value pairs
    where the value for each key may be a different datatype (i.e. settings)"""
    def get_insert_defaults_query(self):
        sql_method = "_executemany"
        query = "INSERT OR IGNORE INTO {0} VALUES (?, ?)".format(self.name)
        args = self.default_values.items()
        return(sql_method, (query, args))
    
    def get_update_values_query(self, data):
        sql_method = "_executemany"
        query = "UPDATE {0} SET value = ? WHERE key = ?".format(self.name)
        args = zip(data.values(), data.keys())
        return(sql_method, (query, args))
        
    def process_results(self, data):
        data_dict = {}
        for key, value in data:
            if key in self.default_types:
                if self.default_types[key] == bool:
                    if value == "0": value = False
                    elif value == "1": value = True
                if self.default_types[key] == int: value = int(value)
            
                data_dict[key.encode()] = value
            
        return(data_dict)

class Database(object):
    def __init__(self, db_path, table_obj=None):
        self.db_path = db_path
        self.table = table_obj
        
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.c = self.conn.cursor()
        self.tables = self._get_tables()
        
        if self.table is not None:
            if self.table.name not in self.tables:
                print("creating table")
                self.create_table()
                self.insert_defaults()

            self.table.columns = self._get_table_columns()
        
    def _require_table_object(self):
        assert isinstance(self.table, Table), "self.table is required"
    
    def _get_tables(self):
        tables = self.query("SELECT name FROM sqlite_master WHERE type='table'")
        return(tuple(t[0] for t in tables))
        
    def _get_indices(self):
        indices = self.query("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name = ?", (self.table.name,))
        return(tuple(i[0] for i in indices))
        
    def _get_table_columns(self):
        cols = self.query("PRAGMA table_info({0})".format(self.table.name))
        return(tuple([c[1] for c in cols]))
        
    def _execute(self, query, values=()):
        self.c.execute(query, values)
        self.conn.commit()
        
    def _executemany(self, query, values=()):
        self.c.executemany(query, values)
        self.conn.commit()
        
    def _executescript(self, sql_script):
        self.c.executescript(sql_script)
        self.conn.commit()
        
    def _call_sql_method(self, sql_method, args):
        getattr(self, sql_method)(*args)
        
    def _rename_table(self):
        self._require_table_object()
        temp_table_name = "_{0}_backup{1}".format(self.table.name, int(time.time()))
        query = "ALTER TABLE {0} RENAME TO {1}".format(self.table.name, temp_table_name)
        print(query)
        self._execute(query)
        return(temp_table_name)
        
    def update_table_struct(self):                
        # drop all indices for this table (important to do this first)
        for index in self._get_indices():
            if index.startswith("sqlite_autoindex"): continue
            query = "DROP INDEX IF EXISTS {0}".format(index)
            print(query)
            self._execute(query)
            
        # rename table
        temp_table_name = self._rename_table()
        
        # create new table with new struct
        self.create_table()
        
        # move data from old table to new
        if self.table.preserve_data:
            query = "INSERT INTO {0} ({1}) SELECT {1} FROM {2}".format(
                self.table.name,
                ",".join(self.table.columns),
                temp_table_name,
            )
            print(query)
            self._execute(query)
        
        # insert (possible) new default values (won't overwrite current data)
        self.insert_defaults()    
        # update table columns to reflect (possible) new table struct
        self.table.columns = self._get_table_columns()
        
        # update table_versions
        self._execute("UPDATE table_versions SET version=? WHERE name=?", (self.table.version, self.table.name))
        # drop backup table
        self._execute("DROP TABLE IF EXISTS {0}".format(temp_table_name))        
        
    def create_table(self):
        self._require_table_object()
        self._call_sql_method(*self.table.get_create_table_query())
        
    def insert_defaults(self):
        self._require_table_object()
        if self.table.get_insert_defaults_query() is not None:
            print("inserting default values, this may take some time...")
            self._call_sql_method(*self.table.get_insert_defaults_query())
        
    def update_table_contents(self, data):
        self._require_table_object()
        self._call_sql_method(*self.table.get_update_values_query(data))
        
    def get_table_contents(self):
        self._require_table_object()
        data = self.query("SELECT * FROM {0}".format(self.table.name))
        data = self.table.process_results(data)
        return(data)
        
    def insert_row(self, **kwargs):
        """Simple frontend for the INSERT query"""
        query = "INSERT INTO {0} ({1}) VALUES ({2})".format(
                                                    self.table.name,
                                                    ",".join(kwargs.keys()),
                                                    ",".join(("?",) * len(kwargs.keys()))
                                                    )
        values = kwargs.values()
        
        self._execute(query, values)
        
    def delete_rows(self, **kwargs):
        """
        Simple frontend for the DELETE query
        
        note: only exact matches supported
        """
        query = "DELETE FROM {0} WHERE {1}".format(
                                            self.table.name,
                                            web.db.sqlwhere(kwargs).query(paramstyle="qmark")
                                            )
        
        values = kwargs.values()
        self._execute(query, values)                
        
        
    def query(self, query, values=()):
        self._execute(query, values)
        return(self.c.fetchall())
        
    def close(self):
        self.conn.commit()
        self.conn.close()
        
        
tables = {
    "table_versions" : Table(
        name = "table_versions",
        version = 1.0,
        preserve_data = True,
        default_values = {},
        default_types = {
            "name"      : str,
            "version"   : float,
        }
    ),
    "settings" : KeyValueTable(
        name = "settings",
        version = 1.0,
        preserve_data = True,
        default_values = {
            "host"              : "localhost",
            "port"              : 80,
            "path"              : "/RPC2",
            "username"          : None,
            "password"          : None,
            "refresh_rate"      : 5,
            "show_torrent_age"  : True,
            "debug"             : False,
            "show_welcome"      : True,
            "du_path"           : "/",
        },
        default_types = {
            "host"              : str,
            "port"              : int,
            "path"              : str,
            "username"          : None,
            "password"          : None,
            "refresh_rate"      : int,
            "show_torrent_age"  : bool,
            "debug"             : bool,
            "show_welcome"      : bool,
            "du_path"           : str,
        },
    ),
    "recent_torrent_dests" : Table(
      name = "recent_torrent_dests",
      version = 1.0,
      preserve_data = True,
      default_values = {},
      default_types = {
          "id"      : int,
          "path"    : str,
      }  
    ),
    #"ip2nation" : Table(
    #    name = "ip2nation",
    #    version = 1.0,
    #    preserve_data = False,
    #)
}

for t in tables:
    if t != "table_versions":
        tables["table_versions"].default_values[t] = tables[t].version
