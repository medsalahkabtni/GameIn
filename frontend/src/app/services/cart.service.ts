import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ProductService} from './product.service';
import {OrderService} from './order.service';
import {environment} from '../../environments/environment';
import {CartModelPublic, CartModelServer} from '../models/cart.model';
import {BehaviorSubject} from 'rxjs';
import {NavigationExtras, Router} from '@angular/router';
import {ProductModelServer} from '../models/product.model';
import {ToastrService} from 'ngx-toastr';
import {NgxSpinnerService} from 'ngx-spinner';


@Injectable({
  providedIn: 'root'
})
export class CartService {
  private serverURL = environment.SERVER_URL;

  private cartDataClient: CartModelPublic = {
    total: 0,
    prodData: [{
      incart: 0,
      id: 0
    }]
  };



  private cartDataServer: CartModelServer = {
    total: 0,
    data: [{
      numInCart: 0,
      // @ts-ignore
      product: undefined
    }]
  };


  cartTotal$ = new BehaviorSubject<number>(0);
  cartData$ = new BehaviorSubject<CartModelServer>(this.cartDataServer);


  constructor(private http: HttpClient,
              private  productService: ProductService,
              private orderService: OrderService,
              private router: Router,
              private toast: ToastrService,
              private spinner: NgxSpinnerService) {

    this.cartTotal$.next(this.cartDataServer.total);
    this.cartData$.next(this.cartDataServer);

    // Get the information from local storage ( if any )
    // @ts-ignore
    let info: CartModelPublic = JSON.parse(localStorage.getItem('cart'));

    // Check if the info variable is null or has some information
    if (info !== null && info !== undefined && info.prodData[0].incart !== 0){
      // Local Storage is not empty and has some information
      this.cartDataClient = info;

      // Loop through each entry and put it in the cartDataServer object
      this.cartDataClient.prodData.forEach(p => {
        this.productService.getSingleProduct(p.id).subscribe((actualProductInfo: ProductModelServer) => {
          if (this.cartDataServer.data[0].numInCart === 0){
            this.cartDataServer.data[0].numInCart = p.incart;
            this.cartDataServer.data[0].product = actualProductInfo;
            this.CalculateTotal();
            this.cartDataClient.total = this.cartDataServer.total;
            localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
          }else {
            // CartDataServer already has some entry on it
            this.cartDataServer.data.push({
              numInCart: p.incart,
              product: actualProductInfo
            });
            this.CalculateTotal();
            this.cartDataClient.total = this.cartDataServer.total;
            localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
          }
          this.cartData$.next({...this.cartDataServer});
        });
      });
    }

  }

  // tslint:disable-next-line:typedef
  AddProductToCart(id: number, quantity?: number) {
    this.productService.getSingleProduct(id).subscribe(prod => {
      // 1. If the cart is empty
      if (this.cartDataServer.data[0].product === undefined){
        this.cartDataServer.data[0].product = prod;
        this.cartDataServer.data[0].numInCart = quantity !== undefined ? quantity : 1;
        this.CalculateTotal();
        this.cartDataClient.prodData[0].incart = this.cartDataServer.data[0].numInCart;
        this.cartDataClient.prodData[0].id = prod.id;
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
        this.cartData$.next({ ... this.cartDataServer});
        this.toast.success(`${prod.name} added to the cart.`, 'Product Added', {
          timeOut: 1500,
          progressBar: true,
          progressAnimation: 'increasing',
          positionClass: 'toast-top-right'
        });
      }
      // 2. If the cart has some items
      else {
        let index = this.cartDataServer.data.findIndex(p => p.product.id === prod.id);  // -1 or a positive value

        // a. if that item is already in the cart => index positive value
        if (index !== -1){
          if (quantity !== undefined && quantity <= prod.quantity){
            // tslint:disable-next-line:max-line-length
            this.cartDataServer.data[index].numInCart = this.cartDataServer.data[index].numInCart < prod.quantity ? quantity : prod.quantity;
          }else {
            // tslint:disable-next-line:max-line-length no-unused-expression
            this.cartDataServer.data[index].numInCart < prod.quantity ? this.cartDataServer.data[index].numInCart++ : prod.quantity;
          }

          this.cartDataClient.prodData[index].incart = this.cartDataServer.data[index].numInCart;
          this.toast.info(`${prod.name} quantity updated in the cart.`, 'Product Updated', {
            timeOut: 1500,
            progressBar: true,
            progressAnimation: 'increasing',
            positionClass: 'toast-top-right'
          });

        }  // END OF IF
        // b. if that item is not in the cart
        else {
          this.cartDataServer.data.push({
            numInCart: 1,
            product: prod
          });

          this.cartDataClient.prodData.push({
            incart: 1,
            id: prod.id
          });
          this.toast.success(`${prod.name} added to the cart.`, 'Product Added', {
            timeOut: 1500,
            progressBar: true,
            progressAnimation: 'increasing',
            positionClass: 'toast-top-right'
          });

          this.CalculateTotal();
          this.cartDataClient.total = this.cartDataServer.total;
          localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
          this.cartData$.next({ ... this.cartDataServer});
        }  // END OF ELSE
      }
    });
  }

  // @ts-ignore
  // tslint:disable-next-line:typedef
  UpdateCartItems(index, increase: boolean) {
    let data = this.cartDataServer.data[index];

    if (increase) {
      // tslint:disable-next-line:no-unused-expression
      data.numInCart < data.product.quantity ? data.numInCart++ : data.product.quantity;
      this.cartDataClient.prodData[index].incart = data.numInCart;
      this.CalculateTotal();
      this.cartDataClient.total = this.cartDataServer.total;
      this.cartData$.next({ ... this.cartDataServer});
      localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
    }else {
      data.numInCart-- ;

      if (data.numInCart < 1){
        this.DeleteProductFromCart(index);
        this.cartData$.next({ ... this.cartDataServer});
      }else {
        this.cartData$.next({ ... this.cartDataServer});
        this.cartDataClient.prodData[index].incart = data.numInCart;
        this.CalculateTotal();
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      }
    }
  }
  // @ts-ignore
  // tslint:disable-next-line:typedef
  DeleteProductFromCart(index: number) {
    if (window.confirm('Are you sure you want to remove the item ?')) {
      this.cartDataServer.data.splice(index, 1);
      this.cartDataClient.prodData.splice(index, 1);
      this.CalculateTotal();
      this.cartDataClient.total = this.cartDataServer.total;

      if (this.cartDataClient.total === 0){
        this.cartDataClient = {prodData: [{incart: 0, id: 0}], total: 0};
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      }else {
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      }

      if (this.cartDataServer.total === 0) {
        // @ts-ignore
        this.cartDataServer = {data: [{numInCart: 0, product: undefined}], total: 0};
        this.cartData$.next({ ... this.cartDataServer});
      }else {
        this.cartData$.next({ ... this.cartDataServer});
      }
    }else {
      return;
    }
  }

  // tslint:disable-next-line:typedef
  private CalculateTotal() {
    let Total = 0;

    this.cartDataServer.data.forEach(p => {
      const {numInCart} = p;
      const {price} = p.product;

      Total += numInCart * price;
    });
    this.cartDataServer.total = Total;
    this.cartTotal$.next(this.cartDataServer.total);
  }

  // tslint:disable-next-line:typedef
  CheckoutFromCart(userId: number) {
    // @ts-ignore
    this.http.post(`${this.serverURL}/orders/payment`, null).subscribe((res: { success: boolean }) => {
      console.clear();
      if (res.success){
        this.resetServerData();
        this.http.post(`${this.serverURL}/orders/new`, {
          userId: userId,
          // @ts-ignore
          products: this.cartDataClient.prodData}).subscribe((data: OrderResponse) => {
          this.orderService.getSingleOrder(data.order_id).then(prods => {
            if (data.success) {
              const navigationExtras: NavigationExtras = {
                state : {
                  message: data.message,
                  products: prods,
                  orderId: data.order_id,
                  total: this.cartDataClient.total
                }
              };

              this.spinner.hide().then();
              this.router.navigate(['/thankyou'], navigationExtras).then(p => {
                this.cartDataClient = {total: 0, prodData: [{incart: 0, id: 0}]};
                this.cartTotal$.next(0);
                localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
              });
            }
          });
        });
      } else {
        this.spinner.hide().then();
        this.router.navigateByUrl('/checkout').then();
        this.toast.error(`Sorry, failed to book the order`, 'Order Status', {
          timeOut: 1500,
          progressBar: true,
          progressAnimation: 'increasing',
          positionClass: 'toast-top-right'
        });
      }
    });
  }

  // tslint:disable-next-line:typedef
  private resetServerData() {
    this.cartDataServer = {
      total: 0,
      data: [{
        numInCart: 0,
        // @ts-ignore
        product: undefined
      }]
    };
    this.cartData$.next({ ... this.cartDataServer});
  }

  // tslint:disable-next-line:typedef
  CalculateSubTotal(index: number) {
    let subTotal = 0;

    let p = this.cartDataServer.data[index];
    subTotal = p.product.price * p.numInCart;

    return subTotal;
  }
}

interface OrderResponse {
  order_id: number;
  success: boolean;
  message: string;
  products: [{
    id: string,
    numInCart: string
  }];

}
