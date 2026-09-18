#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -d "$DIR/圣杯抉择器.app" ]; then
  open "$DIR/圣杯抉择器.app"
else
  open "$DIR/index.html"
fi
