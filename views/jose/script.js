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

      $(`${$form.data('result')}`).html(`<pre>${JSON.stringify(resp, null, 2)}</pre>`)

      if ($form.data('hidden')) {
        $(`${$form.data('hidden')}`).html($.map(resp, (val, key) => `
          <input type="hidden" value="${
            (typeof val === 'string')
              ? val
              : escapeHtml(JSON.stringify(val))}" name="${key}">
        `))
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
})
