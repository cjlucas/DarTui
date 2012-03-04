import rtorrent
import os
import xmlrpclib
from urlparse import parse_qs
from collections import namedtuple
from gzip import GzipFile
from StringIO import StringIO

try:
    import simplejson as json
except ImportError:
    import json

def to_json(input):
    return(json.dumps(input))
    
def decompress_gzip(data):
    f = StringIO()
    f.write(data)
    f.seek(0)
    
    g = GzipFile(fileobj=f, mode="rb")
    return(g.read())
    
def deserialize_args(args):
    """Try to deserialize given args. Return input if not serialized"""
    deserialized = parse_qs(args)
    if deserialized == {}:
        return(args)
    else:
        return(deserialized)

_ntuple_diskusage = namedtuple('usage', 'total used free')

def get_disk_usage(path):
    """Return disk usage statistics about the given path.

    Returned valus is a named tuple with attributes 'total', 'used' and
    'free', which are the amount of total, used and free space, in bytes.
    
    Source: http://stackoverflow.com/a/7285483/975118
    """
    st = os.statvfs(path)
    free = st.f_bavail * st.f_frsize
    total = st.f_blocks * st.f_frsize
    used = (st.f_blocks - st.f_bfree) * st.f_frsize
    return _ntuple_diskusage(total, used, free)

def build_url(host, port=80, username=None, password=None, protocol="http"):
    if username is not None and password is not None:
        url = "{0}://{1}:{2}@{3}:{4}".format(
            protocol,
            username,
            password,
            host,
            port,
        )
    else:
        url = "{0}://{1}:{2}".format(
            protocol,
            host,
            port
        )
        
    return(url)
    
def test_xmlrpc_connection(url):
    conn_status = {}
    conn_status["success"] = False
    conn_status["err_msg"] = None
    c = xmlrpclib.ServerProxy(url)
    try:
        c.system.listMethods()
        conn_status["success"] = True
    except xmlrpclib.ProtocolError as e:
        conn_status["err_msg"] = e.errmsg
    except xmlrpclib.ResponseError:
        conn_status["err_msg"] = "Caught ResponseError"
    except:
        conn_status["err_msg"] = "Unknown Error"
        
    return(conn_status)
    
def get_rtorrent_connection(url):
    try:
        obj = rtorrent.RTorrent(url)
    except:
        obj = None
    return(obj)
