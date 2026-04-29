namespace com.example;

using { cuid, managed } from '@sap/cds/common';

entity Authors : cuid, managed {
  name    : String(100) not null;
  country : String(50);
  books   : Association to many Books on books.author = $self;
}

entity Books : cuid, managed {
  title       : String(200) not null;
  description : String(1000);
  price       : Decimal(10, 2);
  stock       : Integer default 0;
  category    : String(50);
  isbn        : String(20);
  author      : Association to Authors;
}

entity Orders : cuid, managed {
  orderNumber : String(20) not null;
  customer    : String(100);
  status      : String(20) default 'NEW';
  totalAmount : Decimal(10, 2);
  items       : Composition of many OrderItems on items.order = $self;
}

entity OrderItems : cuid {
  order    : Association to Orders;
  book     : Association to Books;
  quantity : Integer;
  price    : Decimal(10, 2);
}