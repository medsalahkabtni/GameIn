import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {environment} from '../../environments/environment';
import {ProductModelServer, ServerResponse} from '../models/product.model';
import {Observable} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private SERVER_URL = environment.SERVER_URL;

  constructor(private http: HttpClient) { }


  // tslint:disable-next-line:typedef
  getAllProducts(numberOfResults = 12): Observable<ServerResponse>{
    return this.http.get<ServerResponse>(this.SERVER_URL + '/products', {
      params: {
        limit: numberOfResults.toString()
      }
    });
  }

  getSingleProduct(id: number): Observable<ProductModelServer> {
    return this.http.get<ProductModelServer>(this.SERVER_URL + '/products/' + id);
  }

  getProductsFromCategory(catName: string): Observable<ProductModelServer[]> {
    return this.http.get<ProductModelServer[]>(this.SERVER_URL + '/products/category/' + catName);
  }
}
