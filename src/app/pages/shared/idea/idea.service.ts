import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

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
