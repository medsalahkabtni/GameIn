import { Component, OnInit } from '@angular/core';
import {CartModelServer} from '../../models/cart.model';
import {CartService} from '../../services/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  // @ts-ignore
  cartData: CartModelServer;
  // @ts-ignore
  cartTotal: number;

  constructor(public cartService: CartService) { }


  ngOnInit(): void {
    this.cartService.cartTotal$.subscribe(total => this.cartTotal = total );

    this.cartService.cartData$.subscribe(data => this.cartData = data );
  }

}
