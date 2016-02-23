FOR DATA CONVERT
===
sudo npm install xlsjs -g
export as 2003 from access then
xls Customers.xls -j > Customers.json

TO DO
===
- basic login
- new go to edit with no ID and blank all shizzle
- clicking on list go to edit with ID
- edit show invoices also with ability to add a line
- Convert phones as xxx-xxx-xxxx
- fields all limited in length by default clipping of attribute bug

LATER
===
- model loosing attributes when put getmodel or putmodel done (bug in lib)
- invoice.attributes[2] refs are shit
- invoice.set('ServiceDate', new Date(invoice.get('ServiceDate'))); // todo fix
- invoice number width when editing invoice is fucked
