#!/bin/sh

scp document.php index.html typing.css typing.js tsubame:edu/public_html/apps/typing
ssh tsubame 'cd edu/public_html/apps/typing; sed -e "s|/lib/jquery-1.4.4.js|/~wakita-k-aa/lib/jquery-1.4.4.js|" index.html > tmp; mv tmp index.html'
