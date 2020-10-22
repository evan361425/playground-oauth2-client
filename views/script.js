$('.get-in-ajax').on('click', function(ev) {
  ev.preventDefault()
  const anchor = this;
  $.get(this.href, {}, (res) => {
    let $a = $(anchor)
    if ($a.data('action') === "clear") {
      $a.siblings().remove()
    }

    if (res.html) {
      $a.after(res.html)
    } else {
      $a.after('<pre>'+JSON.stringify(res, null, 2)+'</pre>')
    }
  })
})
