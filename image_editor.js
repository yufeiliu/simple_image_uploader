$(function () {
  var disabled = true;
  var $fileInput = $('input[name="avatar"]');
  var $hiddenImage = $('.avatar-hidden-preview');
  var $avatarSize = $('#avatarSize');
  var $offsetX = $('input[name="offset_x"]');
  var $offsetY = $('input[name="offset_y"]');

  var lastVal = Number($avatarSize.val());

  // Stuff specific to inline editing
  var $resizeContainer = $('.resize-image-container');
  var $avatarAction = $('.avatar-action');
  var formData;
  var originalAvatarUrl;
  $('.upload-state').click(function (e) {
    originalAvatarUrl = $bg.css('background-image');
    $fileInput.click();
    e.preventDefault();
    e.stopPropagation();
  });

  $('.submit-state').click(function (e) {
    e.stopPropagation();
    $cancelAvatar.hide();
    $resizeContainer.fadeOut('fast');
    $bg.removeClass('with-cursor');
    $avatarAction.removeClass('selected').addClass('uploading');

    //Uploading via ajax
    formData.append('offset_x', $offsetX.val());
    formData.append('offset_y', $offsetY.val());
    formData.append('resize_ratio', $avatarSize.val());

    $.ajax({
      url: "/account/submit_update?inline=true",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false
    }).done(function (data) {
      $bg.css('background-image', 'url(' + data.avatar + ')');
      $bg.css('background-size', '100%');
      $bg.css('background-position', '0');
      $avatarAction.removeClass('uploading').addClass('saved');
      disabled = true;

      window.setTimeout(function () {
        $avatarAction.removeClass('saved').addClass('upload');
      }, 3000);
    });
  });

  var $cancelAvatar = $('.avatar-cancel');
  $cancelAvatar.click(function (e) {
    $avatarAction.removeClass('selected').addClass('upload');
    $resizeContainer.fadeOut('fast');
    $bg.removeClass('with-cursor');
    disabled = true;
    $bg.css('background-size', '100%');
    $bg.css('background-position', '0');
    $bg.css('background-image', originalAvatarUrl);
    $cancelAvatar.hide();

    e.preventDefault();
    e.stopPropagation();
  });

  // Stuff for generating preview and dragging
  var $bg = $('.avatar-preview'),
    elbounds = {
      w: parseInt($bg.width()),
      h: parseInt($bg.height())
    },
    bounds = {w: 2350 - elbounds.w, h: 1750 - elbounds.h},
    origin = {x: 0, y: 0},
    start = {x: 0, y: 0},
    movecontinue = false;

  function move (e){
    var inbounds = {x: false, y: false},
      offset = {
        x: start.x - (origin.x - e.clientX),
        y: start.y - (origin.y - e.clientY)
      };

    inbounds.x = offset.x < 0 && (offset.x * -1) < bounds.w;
    inbounds.y = offset.y < 0 && (offset.y * -1) < bounds.h;

    if (movecontinue && inbounds.x && inbounds.y) {
      start.x = offset.x;
      start.y = offset.y;

      $(this).css('background-position', start.x + 'px ' + start.y + 'px');
      $offsetX.val(Math.round(start.x));
      $offsetY.val(Math.round(start.y));
    }

    origin.x = e.clientX;
    origin.y = e.clientY;

    e.stopPropagation();
    return false;
  }

  function handle (e) {
    if (disabled) {
      return;
    }
    movecontinue = false;
    $bg.unbind('mousemove', move);

    if (e.type == 'mousedown') {
      origin.x = e.clientX;
      origin.y = e.clientY;
      movecontinue = true;
      $bg.bind('mousemove', move);
    } else {
      $(document.body).focus();
    }

    e.stopPropagation();
    return false;
  }

  function reset () {
    start = {x: 0, y: 0};
    $(this).css('backgroundPosition', '0 0');
  }

  $bg.bind('mousedown mouseup mouseleave', handle);
  $bg.bind('dblclick', reset);

  //read image locally
  var imageHeight, imageWidth;
  $fileInput.on('change', function () {
    var oFReader = new FileReader();
    var file = $fileInput.get(0).files[0];
    oFReader.readAsDataURL(file);
    oFReader.onload = function (oFREvent) {
      $bg.css('background-image', 'url(' + oFREvent.target.result + ')');
      $hiddenImage.attr('src', oFREvent.target.result);

      var bgHeight = $bg.height();
      var bgWidth = $bg.width();
      imageHeight = $hiddenImage.height();
      imageWidth = $hiddenImage.width();

      $avatarSize.val(100);
      lastVal = 100;

      var widthOffset = -(imageWidth - bgWidth) / 2;
      var heightOffset = -(imageHeight - bgHeight) / 2;

      $bg.css('background-size', 'auto');
      $bg.css('background-position', widthOffset + 'px ' + heightOffset + 'px');
      $offsetX.val(widthOffset);
      $offsetY.val(heightOffset);
      start = { x: widthOffset, y: heightOffset };


      formData = new FormData();
      formData.append('avatar', file);
      $resizeContainer.fadeIn('fast');
      $bg.addClass('with-cursor');
      $avatarAction.removeClass('upload uploading saved').addClass('selected');
      $cancelAvatar.show();

      disabled = false;
    };
  });

  $avatarSize.on('change', function () {
    var val = Number($avatarSize.val());
    if (imageHeight && imageWidth) {
      var updatedWidth = Math.round(imageWidth / 100 * val);
      var updatedHeight = Math.round(imageHeight / 100 * val);

      $bg.css({
        'background-size': updatedWidth + 'px ' + updatedHeight + 'px'
      });

      var viewportSize = $bg.width() / 2;
      var x, y;
      x = parseInt($bg.css('background-position-x'), 10);
      y = parseInt($bg.css('background-position-y'), 10);

      var oldRatio = lastVal / 100;
      var newRatio = val / 100;

      var newX = (x / oldRatio * newRatio + 125) - 125 / oldRatio * newRatio;
      var newY = (y / oldRatio * newRatio + 125) - 125 / oldRatio * newRatio;

      start.x = newX;
      start.y = newY;

      $bg.css('background-position', newX + 'px ' + newY + 'px');
      $offsetX.val(Math.round(newX));
      $offsetY.val(Math.round(newY));

      lastVal = val;
    }
  });
});