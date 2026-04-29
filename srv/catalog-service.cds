using com.example as db from '../db/schema';

@path: '/catalog'
service CatalogService {

  @odata.draft.enabled
  entity Books as projection on db.Books;

  @readonly
  entity Authors as projection on db.Authors;

  @odata.draft.enabled
  entity Orders as projection on db.Orders;

  entity OrderItems as projection on db.OrderItems;

  action submitOrder(orderId: UUID) returns Orders;
  function topBooks(limit: Integer) returns array of Books;
}