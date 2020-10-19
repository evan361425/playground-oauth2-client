module.exports = (req, res, next) => {
  var render = res.render;

  res.render = (view, options = {}, fn) => {
    const app = req.app
    const defaultLayout = app.get('layout')

    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    if (options.layout === false || ((options.layout || defaultLayout) === false)) {
      render.call(res, view, options, fn);
      return;
    }

    const layout = options.layout || defaultLayout

    render.call(res, view, options, (err, str) => {
      if (err) { return fn ? fn(err) : next(err); }

      let locals = {
        ...options,
        app: str
      };

      render.call(res, layout, locals, fn);
    });
  };

  next();
};
