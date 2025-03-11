import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { OrderByLastMessagePipe } from './pipes/order-by-last-message.pipe';
import { routes } from './app.routes';
import { SearchPipe } from './pipes/search.pipe';
import { ApiService } from './services/api.service';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(),
    OrderByLastMessagePipe,
    SearchPipe,
    ApiService
  ]
};
