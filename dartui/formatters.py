import re

def format_percentage(completed, total):
    p_float = (completed / (total * 1.00)) * 100
    p_formatted = "{0:2.1f}".format(p_float)
    return(p_formatted)
    
def calc_size(n):
    unit_index = 0
    size_reduced = n
    
    # we don't want a result in the thousands
    while size_reduced >= 1000:
        size_reduced /= float(1024)
        unit_index += 1
                                            
    return(size_reduced, unit_index)
    
def format_size(bytes_):
    units = ("B", "KB", "MB", "GB", "TB")
    size_reduced, unit_index = calc_size(bytes_)
    size_formatted = "{0:.2f} {1}".format(size_reduced,
                                        units[unit_index])                                 
    return(size_formatted)
    
def format_speed(bits):
    units = ("KB", "MB", "GB", "TB")
    # convert bits to kilobits before calculating (we dont want 0.0 b/s)
    bits /= float(1024)
    speed_reduced, unit_index = calc_size(bits)
    speed_formatted = "{0:.1f} {1}/s".format(speed_reduced,
                                        units[unit_index])
    return(speed_formatted)
    
def format_ratio(ratio):
    ratio_formatted = "{0:.2f}".format(ratio)
    return(ratio_formatted)
    
def format_time_difference(t_diff, total_unit_count=2):
    units = ("year", "month", "day", "hour", "minute", "second")
    unit_in_seconds = (31536000, 2635200, 86400, 3600, 60, 1)
    current_unit_count = 0
    formatted_diff_list = []
    t_diff_reduced = int(t_diff)
    
    i = 0
    while current_unit_count < total_unit_count and i < len(units):
        cur_unit = units[i]
        cur_unit_in_seconds = unit_in_seconds[i]
        if t_diff_reduced >= cur_unit_in_seconds:
            unit_amt = int(t_diff_reduced / cur_unit_in_seconds) # type-casting truncates float
            
            unit_str = "{0} {1}".format(unit_amt, cur_unit)
            if unit_amt > 1: unit_str += "s"
            formatted_diff_list.append(unit_str)
            
            t_diff_reduced -= (unit_amt * cur_unit_in_seconds)
            current_unit_count += 1
        
        i += 1
    
    t_str = ", ".join(formatted_diff_list)
    return(t_str)
    
def calc_eta(xfer_rate, bytes_remaining):
    eta = 0
    if xfer_rate > 0: eta = bytes_remaining / xfer_rate
    return(eta)
    
def strip_url(tracker_url):
    url_stripped = ""
    regex = r"(http|udp)\:\/\/([^\:\/]*)"
    r = re.search(regex, tracker_url, re.I)
    if r: 
        url_stripped = r.groups()[-1].lower()
        return(url_stripped)
    else:
        return(None)
    
    