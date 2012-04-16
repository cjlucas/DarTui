from setuptools import setup, find_packages
import os, sys

#version = __import__('dartui').__version__

def read(fname):
    return open(os.path.join(os.path.dirname(__file__), fname)).read()

required_pkgs = [
    "web.py>=0.36",
    "rtorrent-python>=0.2.7",
    "simplejson",
]

classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Intended Audience :: End Users/Desktop",
    "License :: OSI Approved :: MIT License",
    "Natural Language :: English",
    "Operating System :: POSIX",
    "Programming Language :: Python",
    "Topic :: Communications :: File Sharing",
    "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
]

setup(
    name="DarTui",
    version="1.1.0",
    url='https://github.com/cjlucas/dartui',
    author='Chris Lucas',
    author_email='chris@chrisjlucas.com',
    maintainer='Chris Lucas',
    maintainer_email='chris@chrisjlucas.com',
    description='An rTorrent web interface with a focus on simplicity, speed and responsiveness',
    long_description=read("README.md"),
    keywords="rtorrent p2p web ajax",
    license="MIT",
    packages=find_packages(),
    scripts=["./bin/dartui"],
    install_requires=required_pkgs,
    classifiers=classifiers,
    include_package_data=True,
)
