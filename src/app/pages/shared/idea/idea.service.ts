import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface IdeaForm {
  expiresAt: { date: string | null; infinite: boolean };
  investmentPeriod: string;
  tradingPosition: string;
  comment: string;
}

@Injectable()
export class IdeaService {
  constructor(private httpClient: HttpClient) {}

  getForm() {}

  generateForm() {}

  getData() {
    return this.httpClient.get('');
  }
}
