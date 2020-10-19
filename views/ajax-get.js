$('.get-in-ajax').on('click', function(ev) {
  ev.preventDefault()
  const anchor = this;
  $.get(this.href, {}, (res) => {
    $(anchor).after('<pre>'+JSON.stringify(res, null, 2)+'</pre>')
  })
})
