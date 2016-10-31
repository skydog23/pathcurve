function add_slider_widget($container, options) {
  var $inputs = $('<div class="inputrow"/>');
  var $text = $(`<input id="${options.name}" type="text" size="${options.size}" maxlength="${options.maxLength}" value="${options.value}"/>`);
  var $label = $(`<label for="${options.name}" data-toggle="tooltip" title="${options.tooltiptext}" data-placement="left">${options.text}</label>`);
  var $slider = $(`<input id="${options.name}-slider" data-slider-tooltip="hide" data-slider-handle="triangle" type="text"/>`);
  $inputs.append($slider).append($text).append($label);

  $slider.slider({
    step: options.step,
    min: options.minValue,
    max: options.maxValue,
    value: options.value,
  }).on("slide", function(slideEvt) {
    $text.val(slideEvt.value);
  });

  $text.on("keyup", function(evt) {
    if (!isNaN($text.val())) {
      $slider.slider('setValue', Number($text.val()));
    }
  });

  return $container.append($inputs);
}

module.exports = {
    add_slider_widget: add_slider_widget
};
