TO DO
===
+ cleanup mongo extra DB
- Backup with download
- Restore procedure

TO DO LATER (PUNTED)
===
- load order not working
- Need map button inside order
- Schedule / click / load work order fails unless load customer done first
- can't assign tech reached limit
- admin delete
- fix customers with spaces in front of name and blanks and dups
- Weird thing where panels move
- Set up users and admin attribute for things like delete
- Call invoice Work Order if no invoice number
- attributes hidden for View Edit Search List
- review code for var module = {};
- new go to edit with no ID and blank all shizzle
- Multi-line notes
- windows 10 / David's computer
- password loaded from config
- server needs to do something different if mongodb not loaded
- customer view with null crashes
- model loosing attributes when put getmodel or putmodel done (bug in lib)
- invoice.attributes[2] refs are shit
- invoice.set('ServiceDate', new Date(invoice.get('ServiceDate'))); // todo fix
- Update MongoDB and login fails - fix deprecated (new is xxx.sort())
- require at least one phone when entering new customer

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
