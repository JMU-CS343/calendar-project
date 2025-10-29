const BTN_MONTHLY = document.getElementById('btn-monthly'),
      BTN_DAILY = document.getElementById('btn-daily'),
      BTN_YEARLY = document.getElementById('btn-yearly'),
      BTN_ADD = document.getElementById('btn-add'),
      BTN_DELETE = document.getElementById('btn-delete'),
      BTN_COLOR = document.getElementById('btn-color'),
      DLG_COLOR = document.getElementById('dlg-color');
BTN_COLOR.addEventListener('click', () => {
    DLG_COLOR.show();
});