TO DO
===

TO DO LATER
===
- Add to Utility Locate "Mark Ref # Done" button
- fix customers with spaces in front of name and blanks and dups
- Weird thing where panels move
- Set up users and admin attribute for things like delete
- Call invoice Work Order if no invoice number

FOR DATA CONVERT
===
sudo npm install xlsjs -g
export as 2003 from access then
xls Customers.xls -j > Customers.json

backup entire server
---
rhc snapshot save bowen -n superseptic

backup database
---
* from: https://www.codeammo.com/article/copy-mongodb-from-openshift
rhc ssh bowen -n superseptic
    open_shift> cd app-root/repo
    open_shift> mongodump --host $OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT --username $OPENSHIFT_MONGODB_DB_USERNAME --password $OPENSHIFT_MONGODB_DB_PASSWORD
    open_shift> zip -r dump.zip dump
    open_shift> exit
rhc scp bowen -n superseptic download ./ app-root/repo/dump.zip

Restore and Run the Database
---
    cd tmp
    mkdir bowenMongo
    mongod -dbpath bowenMongo

- unzip dump.zip
- remove admin folder
* on new terminal process:

    mongorestore dump
    mongod --dbpath dump

UBER BUG
===
  this.transport.send(new Message('GetList', {list: list, filter: filter, order: order}), function (msg) {
    if (false && msg == 'Ack') { // todo wtf is this
      callback(list);
    } else if (msg.type == 'GetListAck') {
      list._items = msg.contents._items;
      list._itemIndex = msg.contents._itemIndex;
      callback(list);
    } else {
      callback(list, Error(msg));
    }
  });


DONE 3/12
===
+ When saving invoice, check off uitlity locate if invoice number entered
+ add sort default to model maint


DONE 3/11
===
+ Add admin / tech list
+ Add fields to Invoice
    + Price
    + Tech 1
    + Tech 2
+ new bug create new order make tech invalid - save twice and all bools toggle!!! / or just new order save
+ service date getting stored as string
+ Fix 1969 service date when blanks (FIXED... TEST)    

+ Utility Locate To Do
+ Schedule Days
+ Massage data to reflect correct state (if invoice number supplied then utility locate done)


DONE BEFORE
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
- change field service to bowen

LATER
===
- new go to edit with no ID and blank all shizzle
- backup database automatically?
- Multi-line notes
- windows 10 / David's computer
- password loaded from config
- server needs to do something different if mongodb not loaded
- customer view with null crashes
- model loosing attributes when put getmodel or putmodel done (bug in lib)
- invoice.attributes[2] refs are shit
- invoice.set('ServiceDate', new Date(invoice.get('ServiceDate'))); // todo fix
- Update MongoDB and loggin fails - fix deprected (new is xxx.sort())     



Call utility locate and provide:
    - address, city, county and cross street


xxxx
locate number reference -  
county ? add to customer drop down
city
cross street ?

- ref # 
- date
- county
- city
- address
- cross street


