import { OrderByLastMessagePipe } from './order-by-last-message.pipe';

describe('OrderByLastMessagePipe', () => {
  it('create an instance', () => {
    const pipe = new OrderByLastMessagePipe();
    expect(pipe).toBeTruthy();
  });
});
