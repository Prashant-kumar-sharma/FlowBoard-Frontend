import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import { environment } from '../../../environments/environment';
import * as BoardActions from '../../store/board/board.actions';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private client!: Client;
  private subscriptions: StompSubscription[] = [];
  private readonly connected$ = new Subject<boolean>();

  constructor(private readonly store: Store) {}

  connect(): void {
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected$.next(true);
        console.log('WebSocket connected');
      },
      onDisconnect: () => {
        this.connected$.next(false);
      },
    });
    this.client.activate();
  }

  subscribeToBoard(boardId: number): void {
    if (!this.client?.connected) {
      setTimeout(() => this.subscribeToBoard(boardId), 500);
      return;
    }

    const cardMovedSub = this.client.subscribe(
      `/topic/board/${boardId}/card-moved`,
      (msg: IMessage) => {
        const data = JSON.parse(msg.body);
        this.store.dispatch(BoardActions.webSocketCardMoved({
          cardId: data.cardId,
          toListId: data.toListId
        }));
      }
    );

    const commentSub = this.client.subscribe(
      `/topic/board/${boardId}/comment-added`,
      (msg: IMessage) => {
        const data = JSON.parse(msg.body);
        this.store.dispatch(BoardActions.webSocketCommentAdded({ cardId: data.cardId }));
      }
    );

    this.subscriptions.push(cardMovedSub, commentSub);
  }

  unsubscribeFromBoard(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  disconnect(): void {
    this.unsubscribeFromBoard();
    this.client?.deactivate();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
