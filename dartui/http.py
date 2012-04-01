import web
import os

urls = (
    "/", "dartui.pages.Index",
    "/welcome", "dartui.pages.Welcome",
    "/set_settings", "dartui.pages.SetSettings",
    "/get_torrents", "dartui.pages.GetTorrents",
    "/get_settings", "dartui.pages.GetSettings",
    "/refresh_rows", "dartui.pages.RefreshRows",
    "/torrent", "dartui.pages.TorrentAction",
    "/test_connection", "dartui.pages.TestConnection",
    "/file_upload_test", "dartui.pages.FileUploadTest",
    "/file_upload_action", "dartui.pages.FileUploadAction",
)

os.chdir(os.path.dirname(__file__))
_template_dir = os.path.join(os.path.dirname(__file__), "templates/")

render = web.template.render(_template_dir)


def run_server(http_ip, http_port):
    app = web.application(urls, globals())
    web.httpserver.runsimple(app.wsgifunc(), (http_ip, http_port))