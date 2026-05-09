import { createReducer, on } from '@ngrx/store';
import * as BoardActions from './board.actions';

export interface BoardState {
  board: any;
  lists: any[];
  cards: any[];
  loading: boolean;
  error: any;
}

export const initialState: BoardState = {
  board: null,
  lists: [],
  cards: [],
  loading: false,
  error: null
};

export const boardReducer = createReducer(
  initialState,

  on(BoardActions.clearBoard, () => ({ ...initialState })),

  on(BoardActions.loadBoardSuccess, (state, { board, lists, cards }) => ({
    ...state,
    board,
    lists,
    cards,
    loading: false
  })),

  on(BoardActions.loadBoardFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(BoardActions.addCard, (state, { card }) => ({
    ...state,
    cards: [...state.cards, card]
  })),

  on(BoardActions.updateCard, (state, { card }) => ({
    ...state,
    cards: state.cards.map(c => c.id === card.id ? card : c)
  })),

  on(BoardActions.moveCardSuccess, (state, { card }) => ({
    ...state,
    cards: state.cards.map(c => c.id === card.id ? card : c)
  })),

  on(BoardActions.archiveCard, (state, { cardId }) => ({
    ...state,
    cards: state.cards.map(c => c.id === cardId ? { ...c, isArchived: true } : c)
  })),

  on(BoardActions.addList, (state, { list }) => ({
    ...state,
    lists: [...state.lists, list]
  })),

  on(BoardActions.updateList, (state, { list }) => ({
    ...state,
    lists: state.lists.map(l => l.id === list.id ? list : l)
  })),

  on(BoardActions.webSocketCardMoved, (state, { cardId, toListId }) => ({
    ...state,
    cards: state.cards.map(c =>
      c.id === cardId ? { ...c, listId: toListId } : c
    )
  }))
);