FOR DATA CONVERT
===
sudo npm install xlsjs -g
export as 2003 from access then
xls Customers.xls -j > Customers.json

TO DO
===
- basic login
- Convert phones as xxx-xxx-xxxx
- do full conversion

TO FIX
===
- new invoice date default to today
- new go to edit with no ID and blank all shizzle
- fields all limited in length by default clipping of attribute bug

LATER
===
- if invoice NULL say new ticket
- deletes
- customer view with null crashes
- get bootstrap to narrow row gaps when view mode
- model loosing attributes when put getmodel or putmodel done (bug in lib)
- invoice.attributes[2] refs are shit
- invoice.set('ServiceDate', new Date(invoice.get('ServiceDate'))); // todo fix
- invoice number width when editing invoice is fucked
