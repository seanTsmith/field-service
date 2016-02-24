FOR DATA CONVERT
===
sudo npm install xlsjs -g
export as 2003 from access then
xls Customers.xls -j > Customers.json

MEETING
===
- Invoice call it work order
- add fields to Invoice
    - tech
    - utilityLocate (Y/N)
    - comment - special instructions

TO DO
===
- basic login
- backup database ?

TO FIX
===
- new invoice date default to today
- new go to edit with no ID and blank all shizzle
- fields all limited in length by default clipping of attribute bug

LATER
===
- password loaded from config
- server needs to do something different if mongodb not loaded
- if invoice NULL say new ticket
- deletes
- customer view with null crashes
- get bootstrap to narrow row gaps when view mode
- model loosing attributes when put getmodel or putmodel done (bug in lib)
- invoice.attributes[2] refs are shit
- invoice.set('ServiceDate', new Date(invoice.get('ServiceDate'))); // todo fix
- invoice number width when editing invoice is fucked
