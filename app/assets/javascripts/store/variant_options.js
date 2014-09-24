$.extend({
  keys: function(obj){
    var a = [];
    $.each(obj, function(k){ a.push(k) });
    return a;
  }
});

if (!Array.indexOf) Array.prototype.indexOf = function(obj) {
  for(var i = 0; i < this.length; i++){
    if(this[i] == obj) {
      return i;
    }
  }
  return -1;
}

if (!Array.find_matches) Array.find_matches = function(a) {
  var i, m = [];
  a = a.sort();
  i = a.length
  while(i--) {
    if (a[i - 1] == a[i]) {
      m.push(a[i]);
    }
  }
  if (m.length == 0) {
    return false;
  }
  return m;
}

function VariantOptions(params) {

  var options = params['options'];
  var i18n = params['i18n'];
  var allow_backorders = !params['track_inventory_levels'];
  var allow_select_outofstock = params['allow_select_outofstock'];
  var default_instock = params['default_instock'];

  var variant, divs, parent, index = 0;
  var selection = [];
  var buttons;


  function init() {
    divs = $('#product-variants .variant-options');
    disable(divs.find('a.option-value').addClass('locked'));
    update();
    enable(parent.find('a.option-value'));
    toggle();
    $('div.variant-options a.clear-button').hide().click(handle_clear);

    if (default_instock) {
      divs.each(function(){
        $(this).find("ul.variant-option-values li a.in-stock:first").click();
      });
    }
    $('.variant-options').each(function()
    {
      var is_selected = false
      $(this).find('.variant-option-values .option-value').each(function()
      {
        if($(this).hasClass('selected'))
        {
          is_selected = true
        }
      })
      if(!is_selected)
      {
        var is_found = false
        $(this).find('.variant-option-values .option-value').each(function()
        {
          if(!is_found && $(this).hasClass('in-stock'))
          {
            is_found = true
            $(this).click()
          }
        })
      }
    })
  }

  function get_index(parent) {
    return parseInt($(parent).attr('class').replace(/[^\d]/g, ''));
  }

  function update(i) {
    index = isNaN(i) ? index : i;
    parent = $(divs.get(index));
    buttons = parent.find('a.option-value');
    parent.find('a.clear-button').hide();
  }

  function disable(btns) {
    return btns.removeClass('selected');
  }
  var i = 0
  function enable(btns) {
    bt = btns.not('.unavailable').removeClass('locked').unbind('click')
    if (!allow_select_outofstock && !allow_backorders)
    {
      bt = bt.filter('.in-stock')
    }
    return bt.click(handle_click).filter('.auto-click').removeClass('auto-click').click();
  }

  function advance() {
    index++
    update();
    inventory(buttons.removeClass('locked'));
    enable(buttons);
  }

  function inventory(btns) {
    var keys, variants, selected = {};
    var sels = $.map(divs.find('a.selected'), function(i) { return i.rel });
    $.each(sels, function(key, value) {
      key = value.split('-');
      var v = options[key[0]][key[1]];
      keys = $.keys(v);
      var m = Array.find_matches(selection.concat(keys));
      if (selection.length == 0) {
        selection = keys;
      } else if (m) {
        selection = m;
      }
    });
    btns.removeClass('in-stock out-of-stock unavailable').each(function(i, element) {
      var variants = get_variant_objects(element.rel);
      var keys = $.keys(variants);
      if (keys.length == 0) {
        disable($(element).addClass('unavailable locked').unbind('click'));
      } else if (keys.length == 1) {
        _var = variants[keys[0]];
        $(element).addClass(_var.in_stock ? selection.length == 1 ? 'in-stock auto-click' : 'in-stock' : 'out-of-stock');
      } else if (allow_backorders) {
        $(element).addClass('in-stock');
      } else {
        var count = 0;
        $.each(variants, function(key, value) {
          count += value.in_stock ? 1 : 0
        });
        $(element).addClass(count > 0 ? 'in-stock' : 'out-of-stock');
      }
    });
  }

  function get_variant_objects(rels) {
    var i, ids, obj, variants = {};
    if (typeof(rels) == 'string') { rels = [rels]; }
    var otid, ovid, opt, opv;
    i = rels.length;
    try {
      while (i--) {
        ids = rels[i].split('-');
        otid = ids[0];
        ovid = ids[1];
        opt = options[otid];
        if (opt) {
          opv = opt[ovid];
          ids = $.keys(opv);
          if (opv && ids.length) {
            var j = ids.length;
            while (j--) {
              obj = opv[ids[j]];
              if (obj && $.keys(obj).length && 0 <= selection.indexOf(obj.id.toString())) {
                variants[obj.id] = obj;
              }
            }
          }
        }
      }
    } catch(error) {
      //console.log(error);
    }
    return variants;
  }

  function to_f(string) {
    return string ? parseFloat(string.replace(/[^\d\.]/g, '')) : 0;
  }

  // Find matching variants for selected option value
  // Set price or price range if matching variants have different prices.
  function find_variant() {
    var selected = divs.find('a.selected');
    var variants = get_variant_objects(selected.get(0).rel);
    if (selected.length == divs.length) {
      return variant = variants[selection[0]];
    } else {
      var prices = [];
      $.each(variants, function(key, value) { prices.push(value.price) });
      prices = $.unique(prices).sort(function(a, b) {
        return to_f(a) < to_f(b) ? -1 : 1;
      });
      if (prices.length == 1) {
        $('#product-price .price').html('<span class="price assumed">' + prices[0] + '</span>');
      } else {
        $('#product-price .price').html('<span class="price from">' + prices[0] + '</span> - <span class="price to">' + prices[prices.length - 1] + '</span>');
      }
      return false;
    }
  }

  function toggle() {
    $('#product-description .original-price').addClass('hidden');
    if (variant) {
      $('#variant_id, form[data-form-type="variant"] input[name$="[variant_id]"]').val(variant.id);
      $('#product-description .price').removeClass('unselected').text(variant.price);
      $('.product-sku').text(variant.sku)
      if(variant.price < variant.original_price)
      {
        $('#product-description .original-price').removeClass('hidden').text(variant.original_price);
      }
      if (variant.in_stock)
        $('#cart-form button[type=submit]').attr('disabled', false).fadeTo(100, 1);
      $('form[data-form-type="variant"] button[type=submit]').attr('disabled', false).fadeTo(100, 1);
      $('.product-out-of-stock').addClass('hidden')
      $('.product-in-stock').removeClass('hidden')
      try {
        show_variant_images(variant.id);
      } catch(error) {
        // depends on modified version of product.js
      }
    } else {
      $('#variant_id, form[data-form-type="variant"] input[name$="[variant_id]"]').val('');
      $('#cart-form button[type=submit], form[data-form-type="variant"] button[type=submit]').attr('disabled', true).fadeTo(0, 0.5);
      $('.product-out-of-stock').removeClass('hidden')
      $('.product-in-stock').addClass('hidden')
      price = $('#product-description .price').addClass('unselected')
      // Replace product price by "(select)" only when there are at least 1 variant not out-of-stock
      variants = $("div.variant-options.index-0")
      if (variants.find("a.option-value.out-of-stock").length != variants.find("a.option-value").length)
      {
        price.text('(select)');
      }
    }
  }

  function clear(i) {
    variant = null;
    update(i);
    enable(buttons.removeClass('selected'));
    toggle();
    parent.nextAll().each(function(index, element) {
      disable($(element).find('a.option-value').removeClass('in-stock out-of-stock').addClass('locked').unbind('click'));
      $(element).find('a.clear-button').hide();
      $(element).find('h6 strong.selection').html('').removeClass('out-of-stock');
    });
    parent.find('strong.selection').html('').removeClass('out-of-stock');
    hide_all_variant_images();
  }


  function handle_clear(evt) {
    evt.preventDefault();
    clear(get_index(this));
  }

  function handle_click(evt) {
    evt.preventDefault();
    variant = null;
    selection = [];
    var a = $(this);
    if (!parent.has(a).length) {
      clear(divs.index(a.parents('.variant-options:first')));
    }
    disable(buttons);
    var a = enable(a.addClass('selected'));
    parent.find('a.clear-button').css('display', 'inline-block');
    advance();
    handle_selected();
    if (find_variant()) {
      toggle();
    }
    $('.variant-options').each(function()
    {
      var is_selected = false
      $(this).find('.variant-option-values .option-value').each(function()
      {
        if($(this).hasClass('selected'))
        {
          is_selected = true
        }
      })
      if(!is_selected)
      {
        var is_found = false
        $(this).find('.variant-option-values .option-value').each(function()
        {
          if(!is_found && $(this).hasClass('in-stock'))
          {
            is_found = true
            $(this).click()
          }
        })
      }
    })
  }

  function handle_selected() {
    var selected = divs.find('a.selected');
    selected.each(function(){
      $this = $(this)
      var selection = $this.parents('.variant-options').find('h6 strong.selection')
      selection.html($this.attr('title'));

      if ($this.hasClass('out-of-stock'))
        selection.addClass('out-of-stock').attr('title', i18n.out_of_stock);
    });
  };
  $(document).ready(init);

};
