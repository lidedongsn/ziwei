chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'format-json', title: '使用 紫微 格式化', contexts: ['selection'] });
  });
});

chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }));

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== 'format-json') return;
  const id = crypto.randomUUID();
  await chrome.storage.session.set({ [id]: info.selectionText || '' });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`index.html#${id}`) });
});
