chrome.action.onClicked.addListener(() => {
  const url = chrome.runtime.getURL("index.html");
  void chrome.tabs.create({ url, active: true });
});
