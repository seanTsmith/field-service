FOR DATA CONVERT
===
sudo npm install xlsjs -g
export as 2003 from access then
xls Customers.xls -j > Customers.json

backup: rhc snapshot save bowen -n superseptic

DONE
===
+ Customer email
+ Customer Source
+ add fields to Invoice
    + Emergency (Y/N)
    + UtilityLocate (Y/N)
    + Customer Notes
    + Tech Notes
- new invoice date default to or blank - no 1969
- search is validating required fields
- validate before saving
- remove the html in bootstrap that disabled field select 
- fields all limited in length by default clipping of attribute bug

TO DO
===
- Call invoice Work Order if no invoice number
- new go to edit with no ID and blank all shizzle

LATER
===
- backup database automatically?
- change field service to bowen
- Multi-line notes
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
