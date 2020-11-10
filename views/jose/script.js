$(() => {
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }

  $('form').on('submit', function(ev) {
    ev.preventDefault()
    let $form = $(this)
    $.post($form.attr('action'), $form.serialize(), resp => {
      if (resp.error) {
        alert(resp.error)
        return;
      }

      $(`${$form.data('result')}`).each((i, el) => {
        var $el = $(el);
        if ($el.is('textarea')) {
          $el.val(JSON.stringify(resp, null, 2))
        } else {
          $el.html(`<pre>${JSON.stringify(resp, null, 2)}</pre>`)
        }
      })

      if ($form.data('hidden')) {
        objectToHidden($(`${$form.data('hidden')}`), resp)
      }
    })
  })

  $('#generateAlg').on('change', function(ev) {
    $(`#${$(this).val()}Options`).show().siblings().hide();
  })

  $('#payloadInteraction').on('click', 'button', function(ev) {
    $(this).closest('li').remove()
  })

  $('#buildTypes input').on('change', function(ev) {
    $(`#build${this.value.toUpperCase()}AlgOpts`).show().siblings().hide()
  })

  $('#keyResult').on('change', function() {
    try {
      var data = JSON.parse(this.value);
      objectToHidden($('.keyHiddenOnly'), data);
    } catch (e) {
      alert('Must be JSON format.');
    }
  })

  $('#addPayload').on('click', ev => {
    $('#payloadInteraction').append(`
      <li class="list-group-item">
        <div class="form-row">
          <div class="col">
            <input class="form-control" name="_claim_key[]" placeholder="Claim Key">
          </div>
          <div class="col">
            <input class="form-control" name="_claim_val[]" placeholder="Claim Value">
          </div>
          <div class="col">
            <button class="btn btn-outline-danger btn-block" type="button">-</button>
          </div>
        </div>
      </li>
      `)
  })

  function objectToHidden($ele, data) {
    $ele.html($.map(data, (val, key) => `
      <input type="hidden" value="${
        (typeof val === 'string')
          ? val
          : escapeHtml(JSON.stringify(val))}" name="${key}">
    `))
  }
})
