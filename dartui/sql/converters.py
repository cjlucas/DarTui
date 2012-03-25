# Copyright (c) 2010 PyMySQL contributors
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
#
# NOTE: This code has been significantly modified for use with DarTui

import sys
import datetime
import time
import re

PYTHON3 = sys.version_info[0] > 2

ESCAPE_REGEX = re.compile(r"[\0\n\r\032\'\"\\]")
ESCAPE_MAP = {'\0': '\\0', '\n': '\\n', '\r': '\\r', '\032': '\\Z',
              '\'': '\\\'', '"': '\\"', '\\': '\\\\'}
              
try:
    set
except NameError:
    try:
        from sets import BaseSet as set
    except ImportError:
        from sets import Set as set

def escape_item(val, charset="utf-8"):
    if type(val) in [tuple, list, set]:
        return escape_sequence(val, charset)
    if type(val) is dict:
        return escape_dict(val, charset)
    if PYTHON3 and hasattr(val, "decode") and not isinstance(val, unicode):
        # deal with py3k bytes
        val = val.decode(charset)
    encoder = encoders[type(val)]
    val = encoder(val)
    if type(val) in [str, int]:
        return val
    val = val.encode(charset)
    return val

def escape_dict(val, charset="utf-8"):
    n = {}
    for k, v in val.items():
        quoted = escape_item(v, charset)
        n[k] = quoted
    return n

def escape_sequence(val, charset="utf-8"):
    n = []
    for item in val:
        quoted = escape_item(item, charset)
        n.append(quoted)
    return "(" + ",".join(n) + ")"

def escape_set(val, charset="utf-8"):
    val = map(lambda x: escape_item(x, charset), val)
    return ','.join(val)

def escape_bool(value):
    return str(int(value))

def escape_object(value):
    return str(value)

def escape_int(value):
    return value

escape_long = escape_object

def escape_float(value):
    return ('%.15g' % value)

def escape_string(value):
    return ("'%s'" % ESCAPE_REGEX.sub(
            lambda match: ESCAPE_MAP.get(match.group(0)), value))

def escape_unicode(value):
    return escape_string(value)

def escape_None(value):
    return 'NULL'
    
def escape_timedelta(obj):
    seconds = int(obj.seconds) % 60
    minutes = int(obj.seconds // 60) % 60
    hours = int(obj.seconds // 3600) % 24 + int(obj.days) * 24
    return escape_string('%02d:%02d:%02d' % (hours, minutes, seconds))

def escape_time(obj):
    s = "%02d:%02d:%02d" % (int(obj.hour), int(obj.minute),
                            int(obj.second))
    if obj.microsecond:
        s += ".%f" % obj.microsecond

    return escape_string(s)

def escape_datetime(obj):
    return escape_string(obj.strftime("%Y-%m-%d %H:%M:%S"))

def escape_date(obj):
    return escape_string(obj.strftime("%Y-%m-%d"))

def escape_struct_time(obj):
    return escape_datetime(datetime.datetime(*obj[:6]))

encoders = {
        bool: escape_bool,
        int: escape_int,
        long: escape_long,
        float: escape_float,
        str: escape_string,
        unicode: escape_unicode,
        tuple: escape_sequence,
        list:escape_sequence,
        set:escape_sequence,
        dict:escape_dict,
        type(None):escape_None,
        datetime.date: escape_date,
        datetime.datetime : escape_datetime,
        datetime.timedelta : escape_timedelta,
        datetime.time : escape_time,
        time.struct_time : escape_struct_time,
}