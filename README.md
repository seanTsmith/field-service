FOR DATA CONVERT
===
sudo npm install xlsjs -g
export as 2003 from access then
xls Customers.xls -j > Customers.json

MEETING
===
- Customer email
- Customer Source
- Invoice call it work order
- add fields to Invoice
    - Emergency (Y/N)
    - UtilityLocate (Y/N)
    - Customer Notes
    - Tech Notes

TO DO
===
- search is validating required fields
- validate before saving
- Default
- Multi-line notes
- new invoice date default to or blank - no 1969
- removed drop and drag shit
- Call invoice Work Order if no invoice number
- change field service to bowen
- remove the html in bootstrap that disabled field select 
- new go to edit with no ID and blank all shizzle
- fields all limited in length by default clipping of attribute bug
- if invoice NULL say new ticket
- deletes
- invoice number width when editing invoice is fucked
- backup database ?

LATER
===
- Set up users and admin attribute for things like delete
- windows 10 / David's computer
- password loaded from config
- server needs to do something different if mongodb not loaded
- customer view with null crashes
- model loosing attributes when put getmodel or putmodel done (bug in lib)
- invoice.attributes[2] refs are shit
- invoice.set('ServiceDate', new Date(invoice.get('ServiceDate'))); // todo fix
- add fields to Invoice
    - Tech
