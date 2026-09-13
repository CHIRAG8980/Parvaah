enum ViewState {
  initial,
  loading,
  empty,
  success,
  failure,
}

extension ViewStateExtension on ViewState {
  bool get isInitial => this == ViewState.initial;
  bool get isLoading => this == ViewState.loading;
  bool get isEmpty => this == ViewState.empty;
  bool get isSuccess => this == ViewState.success;
  bool get isFailure => this == ViewState.failure;
}
