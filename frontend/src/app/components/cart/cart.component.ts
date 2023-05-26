import { Component, OnInit } from '@angular/core';
import {CartModelServer} from '../../models/cart.model';
import {CartService} from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  // @ts-ignore
  cartData: CartModelServer;
  // @ts-ignore
  cartTotal: number;
  // @ts-ignore
  subTotal: number;

  constructor(public cartService: CartService) { }

  ngOnInit(): void {
    this.cartService.cartData$.subscribe(data => this.cartData = data);
    this.cartService.cartTotal$.subscribe(total => this.cartTotal = total);
  }

  // tslint:disable-next-line:typedef
  ChangeQuantity(index: number, increase: boolean) {
    this.cartService.UpdateCartItems(index, increase);
  }

}
