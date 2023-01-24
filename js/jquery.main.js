let sliders = null;

$(document).ready(function(){

	sliders = $('.header-carousel').owlCarousel({
		items: 1,
		dots: false,
		loop: true,
		dotsEach: 1,
        // К одному слайдеру - применимо, если слайдеров два , то они рассинхронизируются со временем
		//autoplay: true,
		//autoplayTimeout: 5000,
		smartSpeed: 2500,
		touchDrag: false,
		mouseDrag: false
	});

	setInterval(function () {
		sliders.trigger('next.owl.carousel');
	}, 10_000)

	$('.phone-field').inputmask("+7(999)999-9999");
	initDataLoading(currentRoute);
	initScrollTopButton();
	initCounter();
	initHeaderFixed();
	initMap();
	initDatePicker();
	initSelect();
	initScrollMenu();
    initSlickSlider();
    initHeader();
    initAccordion();
	initScrollHeader();
	initSlickSliderMobile();
	initMarquee();
	initFancybox();
    checkOrderPaymentStatus();

    tippy('[data-tippy-content]', {
        arrow: true,
        offset: [0, 0],
		content: 'Tooltip',
		allowHTML: true,
		interactive: true
	});
});


var availablesDates = [];
var availablesCruises={};
var currentRoute = null;
var currentDate;
function initDataLoading(route) {

    $('[data-src="#buy-ticket"]').on('click', function () {
        if (typeof (sendVKAnalyticsEvent) === 'function') {
            sendVKAnalyticsEvent('addtocart', true);
        }

        if (typeof (reachMetrikaGoal) === 'function') {
            reachMetrikaGoal('AddToCart', true);
        }
    });

	currentDate = moment(new Date()).format('YYYY-MM-DD');

	$.ajax({
		url: "/ajax/available-cruise-dates",
		type: "GET",
		dataType: 'json',
	}).done(function( data ) {
		if (Array.isArray(data)) {
			availablesDates = data;
		}
		if (availablesDates.length) {
            currentDate = availablesDates[0];
			updateDatesForm(currentDate);
			initDatePicker();
			updateCruiseDate(route, currentDate, function(){
			})
		} else {
			updateDatesForm(currentDate);
		}
	}).fail(function() {
		updateDatesForm(currentDate);
	});
}

function updateCruiseDate(route, date, callback) {
	availablesCruises[date] = {};
	$.ajax({
		url: "/ajax/available-cruises?date="+date,
		type: "GET",
		dataType: 'json',
	}).done(function( data ) {
        availablesCruises[date] = [];

		for (var i = 0; i < data.length; i++) {
			var cruise = data[i];

			if(currentRoute === null){
                currentRoute = cruise.route;
            }

			if (!availablesCruises[date][cruise.route]) {
                availablesCruises[date][cruise.route] = [];
            }

            availablesCruises[date][cruise.route].push(cruise);
		}
		updateCruiseRoute(date);
	})
}

function updateCruiseRoute(date) {
	$('#destination_ext option').each(function(){
		var val = $(this).val();
		if (availablesCruises[date][val]) {
			$(this).removeAttr('disabled', 'disabled');
			$('.destination-list .item-'+val).show();
		} else {
			$(this).attr('disabled', 'disabled');
			$('.destination-list .item-'+val).hide();
		}

	})

	if (Object.keys(availablesCruises[date]).length>1) {
		$('#destination_ext option[value=3]').removeAttr('disabled', 'disabled');
		$('.destination-list .item-3').show();
	}

    $('input[name=destination][value='+currentRoute+']').attr('checked', true);

	//$('#destination_ext').val(currentRoute).trigger('change');

	updateCruiseRouteTime(date, currentRoute)
}

function updateCruiseRouteTime(date, route, backroute) {
	if (route == 3) {
		updateCruiseRouteTime(date, 1, false);
		updateCruiseRouteTime(date, 2, true);

        updateCruisePrice(true);
	} else {
		if (backroute == true) {
			$('.field-item-from').show();
		} else {
			$('.field-item-from').hide();
		}

		var cruises = availablesCruises[date][route];
		var timeEl = (backroute == true ? '#time_from' : '#time_to');

        $(timeEl).find('option').remove();

        for (var i=0; i<cruises.length; i++) {
			var newOption = new Option(cruises[i].time, cruises[i].id, false, false);
			$(timeEl).append(newOption)
		}

        var $timeTo = $('#time_to :selected');

        if(backroute === true && $timeTo.length > 0 && !isNaN($timeTo.text().replace(':', ''))){
    		var minTime = parseInt($timeTo.text().replace(':', '')),
                alreadySelected = false;

    		$('#time_from option').each(function(){
    		    var $this = $(this);

    		    if(alreadySelected || isNaN($this.text().replace(':', ''))){
    		        return;
                }

    		    var thisOptionTime = parseInt($this.text().replace(':', ''));

                console.log(minTime, thisOptionTime, minTime < thisOptionTime);

    		    if(minTime < thisOptionTime){
    		        $this.attr('selected', true);
                    alreadySelected = true;
                }
            })
        }


		$(timeEl).trigger('change', ['programmatic']);

		if (typeof backroute == "undefined") {
            updateCruisePrice(false);
        }
	}
}

function updateCruisePrice(backroute) {
    getOrderRequest(backroute, true, function(data) {
        if (data.success) {
            $('#input-result').val(data.price.toLocaleString('ru-RU')+' ₽');

            if (data['promocode-message']) {
                $('#promocode-error').text(data['promocode-message']);
            } else {
                $('#promocode-error').text('');
            }
        } else {

            $('#promocode-error').text('');
            if (data.code === 'E_FREE_SEATS_EXCEEDED') {
                $('.tariff-list .item:last-child .counter input')[0].value = data.value;
            }

            if ($('#buy-ticket').css('display') !== 'none') {
                $.fancybox.open('<div class="message"><h2>Ошибка!</h2><p>' + data.message + '</p></div>');
            }
        }
    });
}

function requestOrderConfirmation()
{
        $.fancybox.open('<div class="message"><h2>ПЕРЕД ОПЛАТОЙ ПРОВЕРЬТЕ ПРАВИЛЬНОСТЬ ЗАПОЛНЕННЫХ ДАННЫХ</h2><p>' + data.message + '</p></div>');
}

function createOrder(backroute) {
    $('.buy-confirmation-popup .btn-confirm').attr('disabled', true);
    getOrderRequest(backroute, false, function(data) {
        if (data.success) {
            var currentPrice = $('#input-result').val().replace(/\D/g, '');
            try {
                // ym(78818886, 'reachGoal', 'Purchase', { order_price: currentPrice, currency: 'RUB' });
                // fbq('track', 'Purchase', { value: currentPrice, currency: 'RUB' });
            } catch (e) {
                console.log(e);
            }
            setTimeout(function(){
                document.location.href = data.url;
            }, 1000);
        } else {
            if (data.code === 'E_FREE_SEATS_EXCEEDED') {
                $('.tariff-list .item:last-child .counter input')[0].value = data.value;
            }

            $.fancybox.open('<div class="message"><h2>Ошибка!</h2><p>'+data.message+'</p></div>');
            $('.buy-confirmation-popup .btn-confirm').attr('disabled', false);
        }
    });
}

function getOrderRequest(backroute, calculate, callback) {
    var seats = [];
    $('.tariff-list input').each(function(){
        if ($(this).val() > 0) {
            seats.push({
                category_id: $(this).data('tariff'),
                count: $(this).val()
            })
        }
    })

		// can be used for client-side validation
		let nonFreeSeatsCount = 0;
		const freeSeatsCount = seats.reduce((acc, seat) => {
				if (seat.category_id == 4) {
						return acc + parseInt(seat.count);
				}

				nonFreeSeatsCount += parseInt(seat.count)
		}, 0);
		const maxFreeSeatsCount = nonFreeSeatsCount * 3;

    var requestData = {
        direct_cruise_id: $('#time_to').val(),
        seats: seats,
        name: 't',
        email: 't',
        promocode: $('input[name=promocode]').val().toUpperCase()
    }

    if (backroute === true) {
		requestData.back_cruise_id = $('#time_from').val();
	}

    var url = "/ajax/create-order";
    if (calculate) {
        url += "?action=calculate";
    } else {
        requestData.name = $('.form-field > input[name=name]').val();
        requestData.email = $('.form-field > input[name=email]').val();

		let phone = $('.form-field > input[name=phone]').val();
		phone = '+' + phone.replace(/\D/g,'');

        requestData.phone = phone;
    }

    $.ajax({
        url: url,
        type: "POST",
        data: JSON.stringify(requestData),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
    }).done(function( data ) {
        if (typeof callback == 'function')
            callback(data);
    })
}

function updateDatesForm(now_date) {
	var formattedDate = moment(now_date).format('DD-MM-YYYY')
	$('input.datepicker').val(formattedDate);
	$('input.datepicker').attr('placeholder', formattedDate);
}

function checkOrderPaymentStatus(){
    var status = findGetParameter('payment');

    if(status){
        var message ='<div class="message"><h2>Ошибка</h2><p>К сожалению оплата не прошла! Попробуйте заново.</p></div>';

        if (status === 'succeeded') {
            try {
                sendVKAnalyticsEvent('purchase', true);
                sendVKAnalyticsGoal('purchase', true);

                let params = {};
                const orderPrice = findGetParameter('order');
                if (orderPrice) {
                    params.order_price = parseFloat(atob(orderPrice));
                }
                if (typeof (reachMetrikaGoal) === 'function') {
                    reachMetrikaGoal('Purchase', true, params);
                }
            } catch (e) {
                console.warn(e);
            }
            message ='<div class="message"><h2>Поздравляем!</h2><p>Оплата прошла успешно! Билеты направлены на указанную Вами почту.</p></div>'
        }

        $.fancybox.open(message);
        window.history.pushState('', '', '/');
    }
}

function initFancybox(){
	$.fancybox.defaults.touch = false;

	$(document).on('click', '.buy-confirmation-popup .btn-edit', function(e){
	    e.preventDefault();

	    $.fancybox.close();
    });

	$(document).on('click', '.buy-confirmation-popup .btn-confirm', function(e){
	    e.preventDefault();

	    $.fancybox.close();
        createOrder(currentRoute == 3);
    });
}

function initMarquee() {
    fetch('/ajax/marquee').then(r => r.json()).then(r => {
		if (r.text) {
			return $('.marquee-title').text(r.text);
		}
		$('.attention__box').css('padding', 0);
    });
}

function initScrollTopButton(){
	var button = $('.btn-scroll');
	$(window).on('scroll', function () {
		if ($(this).scrollTop() > 250) {
			button.addClass('show');
		} else {
			button.removeClass('show');
		}
	});
	$('.btn-scroll').on('click', function (e) {
		e.preventDefault();
		$('html, body').animate({
			scrollTop: 0
		}, 700);
	});
}

function initCounter() {
	$('.counter a').on('click', function (e) {
		e.preventDefault();
		var input = $(this).closest('.counter').find('input');
		var val = parseInt(input.val());
		if ($(e.target).hasClass('minus')) {
			val--;
		} else {
			val++;
		}
		input.val(val).change();
	});
	$('.counter input').on('keydown change', function (e) {
		if (e.keyCode != 46 && e.keyCode != 8 && e.keyCode != 37 && e.keyCode != 39 && e.keyCode != 35 && e.keyCode != 36 && (e.keyCode < 48 || e.keyCode > 57)) {
			return false;
		}
	});
	$('.counter input').on('keyup change', function (e) {
		var max = $(this).closest('.counter').find('input').data('max');
		if ($(this).val() < 0) {
			$(this).val(1);
		}
		if ($(this).val() >= max) {
			$(this).val(max);
		}
	});
}

function initHeaderFixed() {
	$(window).on('load resize scroll', function () {
		if ($(window).scrollTop() > 0) {
			$('body').addClass('fixed-header');
		} else {
			$('body').removeClass('fixed-header');
		}
	});
}

function initMap(){
	ymaps.ready(init);
	function init(){
		$('.map-card').each(function () {
			var $map = $(this),
				location = $map.data('location').split(', ');
			var map = new ymaps.Map(this, {
				center: location,
				zoom: 16
			});
			var myPlacemark = new ymaps.Placemark(location, {}, {
				iconLayout: 'default#image',
				iconImageHref: './images/marker.svg',
				iconImageSize: [24, 24]
			});
			map.geoObjects.add(myPlacemark);
		});
	}
}

function initDatePicker(){
	$('input.datepicker').daterangepicker({
		singleDatePicker: true,
		showDropdowns: false,
		minYear: 2020,
		minDate: new Date(),
		autoApply: true,
		locale:{
			format: 'DD-MM-YYYY',
			separator: " to ",
            daysOfWeek: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
            firstDay: 1,
            monthNames: ["Январь", "Декабрь", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
		},
		isInvalidDate: function(ele) {
			return availablesDates.indexOf(moment(ele._d).format('YYYY-MM-DD')) == -1
		}
	});
	$('input.datepicker').on('apply.daterangepicker', function(ev, picker) {
		var dateArr = $(this).val().split('-');
		currentDate = dateArr[2]+'-'+dateArr[1]+'-'+dateArr[0];
		updateCruiseDate(currentRoute, currentDate);
	});
}

function initSelect(){

    $('.route-select').select2({
        minimumResultsForSearch: Infinity,
        dropdownParent: $('#main-route-block')
        // width: '100%',
    });

	$('#time_from').select2({
		minimumResultsForSearch: Infinity,
		width: '100%',
        dropdownParent: $('#time_from').parent()
		// dropdownCssClass: "select-drop-open"
	});
    $('#time_to').select2({
		minimumResultsForSearch: Infinity,
		width: '100%',
        dropdownParent: $('#time_to').parent(),
		dropdownCssClass: "time-select-dropdown"
	});

	$('.select-field').select2({
		minimumResultsForSearch: Infinity,
		width: 'resolve'
	});
};

function initScrollMenu() {
	$(window).on('load', function() {
		$('.main-menu .scroll-cover').sly({
			horizontal: 0,
			vertical: 1,
			smart: 1,
			mouseDragging: 0,
			touchDragging: 1,
			releaseSwing: 1,
			speed:1,
			scrollBy:60,
			elasticBounds: 0,
			easing: 'swing',
			dragHandle: 1,
			dynamicHandle: 0,
			clickBar: 1
		});
	});

	$('.scroll-cover').on('touchmove touchstart mousewheel', function(e) {
		if(!$(e.target).closest('a').length){
			e.preventDefault();
			$('.main-menu .scroll-cover').sly('reload');
		}
	});
};

function initSlickSlider(){
	$('.gallery-slider').slick({
        slidesToShow: 1,
		arrows: false,
		variableWidth: true,
		centerMode: true,
		infinite: true,
		responsive: [
			{
				breakpoint: 1024,
				settings: {
					slidesToShow:1,
					centerPadding: '140px',
					centerMode: true
				}
			},
			{
				breakpoint: 480,
				settings: {
					slidesToShow: 1,
					centerPadding: '20px',
					centerMode: true
				}
			}
		]
	});
	$('.reviews-slider').slick({
        slidesToShow: 3,
		dots: false,
		variableWidth: true,
		infinite: true,
		responsive: [
			{
				breakpoint: 1024,
				settings: {
					slidesToShow: 1,
					variableWidth: false,
					arrows: true,
					adaptiveHeight: true
				}
			}
		]
	});
};

function initHeader() {
	$('.burger').on('click', function(e) {
		e.preventDefault();
		$('body').toggleClass('nav-open');
	});
};

function initAccordion(){
	$('.accordion-item:not(.open) .expanded').hide();
	$('.accordion-item .title-toggle').on('click', function() {
	var item = $(this).closest('.accordion-item')[0];
	$(this).closest('.accordion-item').toggleClass('open');
		if($(this).closest('.accordion-item').hasClass('open')){
			$(this).closest('.accordion-item').find('.expanded').stop().slideDown();
			$(this).closest('.accordion-item').closest('.accordion-items').find('.accordion-item').each(function(){
			if(this != item){
				$(this).removeClass('open').find('.expanded').stop().slideUp()
			}
		});
		} else {
			$(this).closest('.accordion-item').find('.expanded').stop().slideUp();
		}
	});
};

function initScrollHeader(){
	$(window).on('load resize scroll', function() {
	  var _top = $(window).scrollTop();
	  for(var i = offsetArr.length - 1; i >= 0; i--){
		if(_top + $('.header').innerHeight() + 5 > offsetArr[i]){
		  $('.nav >ul >li').removeClass('active');
		  $('.nav >ul >li').eq(i).closest('li').addClass('active');
		  break;
		} else if(_top < offsetArr[0]) {
		  $('.nav >ul >li').removeClass('active');
		}
	  }
	});

	var offsetArr = [];
	$(window).on('load resize', function() {
	  offsetArr = [];
	  for(var i = 0; i < $('.nav >ul >li').length; i++){
		var elId = $('.nav >ul >li').eq(i).find('a').attr('href');
			if(elId !== '#' && $(elId).length){
				offsetArr.push($(elId).offset().top);
			}
	  }
	});
	
  
	var time;
	$('.nav ul a').on('click', function() {
	  if($(this).attr('href')[0] == "#"){
		if($($(this).attr('href')).length){
		  var self = this;
		  $('body').removeClass('nav-open');
		  var dest = $($(self).attr('href')).offset().top - $('.header').innerHeight();
		  $('html, body').stop().animate({
			scrollTop: dest
		  }, 700);
		  if(time){
			clearTimeout(time);
		  }
		  time = setTimeout(function() {
			var dest = $($(self).attr('href')).offset().top - $('.header').innerHeight();
			$('html, body').stop().animate({
			  scrollTop: dest
			}, 100);
		  }, 700);
		  return false;
		}
	  }
	});

	$('input[name=destination]').on('change', function() {
		var value = $(this).val();
		currentRoute = value;

		$('#destination_ext').val(value).trigger("change", [true]);

        updateCruiseRouteTime(currentDate, currentRoute);
	})

	$('#destination_ext').on('change', function(event, noUpdate) {
		var value = $(this).val();
        currentRoute = value;
        if (typeof (reachMetrikaGoal) === 'function') {
            reachMetrikaGoal('InitiateCheckout', true);
        }


		if (noUpdate != true) {
            var $destination = $('input[name=destination][value='+value+']');
            $($destination).prop("checked", true)
            updateCruiseRouteTime(currentDate, currentRoute)
        }
	});

	$('#date_ext').on('change', function(event, noUpdate) {
        var value = $(this).val();
        currentDate = value;
        if (typeof (reachMetrikaGoal) === 'function') {
            reachMetrikaGoal('InitiateCheckout', true);
        }

        if (noUpdate != true) {
            var $date = $('input[name=date]');
            $($date).val(currentDate);
            $('input.datepicker').trigger('apply.daterangepicker');
        }
    });

    $(document).on('afterClose.fb', function(e, instance, el) {
        if (el.src == '#buy-ticket') {
            $('.tariff-list input').val('0');
            $('.tariff-list input[name=category_1]').val($('#category_1_ext').val());
            $('input[name="name"]').val('');
            $('input[name="email"]').val('');
            $('input[name="promocode"]').val('');
            $('input[name="agree_policy"]').prop('checked', false);
            buyTicketFormValidator.resetForm();
            $(".error").removeClass("error");
        }
    });

    $('#category_1_ext').on('change', function() {
        $('.tariff-list input[name=category_1]').val($(this).val()).trigger('change');
    });

    $('input[name=time_to]').on('change', function() {
        updateCruisePrice(currentRoute == 3);
    });

/*	$.validator.addMethod("need_full", function(value) {
		return $('input[name=category_1]').val()>0 || $('input[name=category_2]').val()>0 || $('input[name=category_3]').val()>0;
	}, 'Добавьте минимум 1 билет тарифа Полный');*/

	var buyTicketFormValidator = $("#buy-ticket-form").validate({
		rules: {
		    phone: {
		        minlength: 6,
                maxlength: 15
            },
            agree: {
                required: true,
            }
			/*category_4: {
				need_full: true,
			},*/
		},
        ignore: '.datepicker',
		messages: {
			email: 'Неверно введён e-mail',
			name: 'Заполните поле',
            phone: 'Укажите номер телефона',
			agree: 'Необходимо дать согласие'
		},
		errorPlacement(error, element) {
			if (element.attr("name") === "agree") {
				error.insertAfter(element.parent().find('.check-text'));
			} else {
				error.insertAfter(element);
			}
		},
		submitHandler(form, e) {
		    e.preventDefault();

            if (typeof (reachMetrikaGoal) === 'function') {
                reachMetrikaGoal('FinishCheckout', true);
            }

		    var $confirmationContent = $('#buy-confirmation-popup').clone();

		    var date = $('.buy-ticket-form [name="date"]').val() || '',
		        time_to = $('.buy-ticket-form [name="time_to"] :selected').text() || '',
		        time_from = $('.buy-ticket-form [name="time_from"] :selected').text() || '',
                destination = $('.buy-ticket-form [name="destination"]:checked+span').text() || '',
                name = $('.buy-ticket-form [name="name"]').val() || '',
                email = $('.buy-ticket-form [name="email"]').val() || '',
                phone = $('.buy-ticket-form [name="phone"]').val() || '',
                price = $('.buy-ticket-form #input-result').val() || '',
                tariffs = '';

		    $confirmationContent.find('.order-details').append(
          confirmationFormLine("Дата отправления:", date)+
                ($('.buy-ticket-form [name="time_from"]').is(':visible')
                    ? (   confirmationFormLine("Из Санкт-Петербурга:", time_to) +
                confirmationFormLine("Из ГМЗ Петергоф:", time_from))
                    : confirmationFormLine("Время отправления:", time_to)) +
                  confirmationFormLine("Направление:", destination) +
                  confirmationFormLine("ФИО:", name) +
                  confirmationFormLine("Телефон:", phone) +
                  confirmationFormLine("E-mail:", email));

          $('.buy-ticket-form .end-tariff .tariff-list .item').each(function() {
            const $this = $(this),
                val = $this.find('.counter input').val();

            if (!isNaN(val) && parseInt(val) > 0) {
              const name = $this.find('.flex-inner:first-child>.checkbox-holder>span').text();
              tariffs += '<li><span class="tariff-name">' + name + ' (комфорт)</span> × <span class="count">' + val + '</span></li>';
            }
          });

          $('.buy-ticket-form .tariff-block:not(.end-tariff) .tariff-list .item').each(function () {
            const $this = $(this),
                  val = $this.find('.counter input').val();

            if (!isNaN(val) && parseInt(val) > 0) {
              const name = $this.find('.flex-inner:first-child>.checkbox-holder>span').text();
              tariffs += '<li><span class="tariff-name">' + name + ' (стандарт)</span> × <span class="count">' + val + '</span></li>';
            }
          });

          if(tariffs.length > 0){
            $confirmationContent.find('.order-details').append(confirmationFormLine("Выбранные тарифы:", tariffs))
          }

          $confirmationContent.find('.order-details').append(confirmationFormRedLine("ИТОГО:", price) +
          "<br><p class='order-details-callback'>После оплаты на почту направляются два письма, содержащие кассовый чек и билет.</p>" +
          "<p class='order-details-callback'>Обращаем внимание, что кассовый чек не является основанием для посадки на теплоход. Основанием для посадки является только билет на фирменном бланке компании.</p>" +
          "<p class='order-details-callback'>Если в течение 15 минут после оплаты билеты не пришли на указанную Вами почту, проверьте папку «Спам», а при необходимости свяжитесь с нами <span style='display: inline-block'>+7 812 335-17-17</span></p>");

          $.fancybox.open($confirmationContent.clone().html());
		}
	});

    $('#time_to').on('change', function () {
        updateCruisePrice(currentRoute == 3);
    });

    $('.buy-ticket-form').on('change', function (e, tag) {
        if (tag !== 'programmatic' && (typeof (reachMetrikaGoal) === 'function')) {
            reachMetrikaGoal('InitiateCheckout', true);
        }
    })

    $('.tariff-list input').on('change', function () {
        updateCruisePrice(currentRoute == 3);
    });
    $('input[name="promocode"]').on('change', function () {
        updateCruisePrice(currentRoute == 3);
        if (typeof (reachMetrikaGoal) === 'function') {
            reachMetrikaGoal('EnterPromocode', true);
        }
    });
}

function confirmationFormLine(fieldName, value) {
  return "      <div class=\"order-details-wrapper\">\n" +
    "        <div class=\"order-details-name\">" + fieldName + "</div>\n" +
    "        <div class=\"order-details-text\">" + value + "</div>\n" +
    "      </div>"
}

function confirmationFormRedLine(fieldName, value) {
  return "      <div class=\"order-details-wrapper\">\n" +
    "        <div class=\"order-details-name\" style='color: #962344'>" + fieldName + "</div>\n" +
    "        <div class=\"order-details-text\" style='color: #962344'>" + value + "</div>\n" +
    "      </div>"
}


function initSlickSliderMobile() {
	initSLider();
	$(window).on('load resize orientationchange', function () {
		initSLider();
	});

	function initSLider() {
		$('.advantages-items').each(function () {
			var $carousel = $(this);
			if ($(window).width() >= 1024 && $carousel.hasClass('slick-initialized')) {
				$carousel.slick('unslick');
			} else if ($(window).width() < 1024 && !$carousel.hasClass('slick-initialized')) {
				$carousel.slick({
					slidesToShow: 1,
					dots: false,
					arrows: true
				});
			}
		});
	}
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
}

(function(factory){"use strict";if(typeof define==="function"&&define.amd){define(["jquery"],factory)}else if(typeof exports!=="undefined"){module.exports=factory(require("jquery"))}else{factory(jQuery)}})(function($){$.fn.marquee=function(options){return this.each(function(){var o=$.extend({},$.fn.marquee.defaults,options),$this=$(this),$marqueeWrapper,containerWidth,animationCss,verticalDir,elWidth,loopCount=3,playState="animation-play-state",css3AnimationIsSupported=false,_prefixedEvent=function(element,type,callback){var pfx=["webkit","moz","MS","o",""];for(var p=0;p<pfx.length;p++){if(!pfx[p])type=type.toLowerCase();element.addEventListener(pfx[p]+type,callback,false)}},_objToString=function(obj){var tabjson=[];for(var p in obj){if(obj.hasOwnProperty(p)){tabjson.push(p+":"+obj[p])}}tabjson.push();return"{"+tabjson.join(",")+"}"},_startAnimationWithDelay=function(){$this.timer=setTimeout(animate,o.delayBeforeStart)},methods={pause:function(){if(css3AnimationIsSupported&&o.allowCss3Support){$marqueeWrapper.css(playState,"paused")}else{if($.fn.pause){$marqueeWrapper.pause()}}$this.data("runningStatus","paused");$this.trigger("paused")},resume:function(){if(css3AnimationIsSupported&&o.allowCss3Support){$marqueeWrapper.css(playState,"running")}else{if($.fn.resume){$marqueeWrapper.resume()}}$this.data("runningStatus","resumed");$this.trigger("resumed")},toggle:function(){methods[$this.data("runningStatus")==="resumed"?"pause":"resume"]()},destroy:function(){clearTimeout($this.timer);$this.find("*").addBack().off();$this.html($this.find(".js-marquee:first").html())}};if(typeof options==="string"){if($.isFunction(methods[options])){if(!$marqueeWrapper){$marqueeWrapper=$this.find(".js-marquee-wrapper")}if($this.data("css3AnimationIsSupported")===true){css3AnimationIsSupported=true}methods[options]()}return}var dataAttributes={},attr;$.each(o,function(key){attr=$this.attr("data-"+key);if(typeof attr!=="undefined"){switch(attr){case"true":attr=true;break;case"false":attr=false;break}o[key]=attr}});if(o.speed){o.duration=parseInt($this.width(),10)/o.speed*1e3}verticalDir=o.direction==="up"||o.direction==="down";o.gap=o.duplicated?parseInt(o.gap):0;$this.wrapInner('<div class="js-marquee"></div>');var $el=$this.find(".js-marquee").css({"margin-right":o.gap,float:"left"});if(o.duplicated){$el.clone(true).appendTo($this)}$this.wrapInner('<div style="width:100000px" class="js-marquee-wrapper"></div>');$marqueeWrapper=$this.find(".js-marquee-wrapper");if(verticalDir){var containerHeight=$this.height();$marqueeWrapper.removeAttr("style");$this.height(containerHeight);$this.find(".js-marquee").css({float:"none","margin-bottom":o.gap,"margin-right":0});if(o.duplicated){$this.find(".js-marquee:last").css({"margin-bottom":0})}var elHeight=$this.find(".js-marquee:first").height()+o.gap;if(o.startVisible&&!o.duplicated){o._completeDuration=(parseInt(elHeight,10)+parseInt(containerHeight,10))/parseInt(containerHeight,10)*o.duration;o.duration=parseInt(elHeight,10)/parseInt(containerHeight,10)*o.duration}else{o.duration=(parseInt(elHeight,10)+parseInt(containerHeight,10))/parseInt(containerHeight,10)*o.duration}}else{elWidth=$this.find(".js-marquee:first").width()+o.gap;containerWidth=$this.width();if(o.startVisible&&!o.duplicated){o._completeDuration=(parseInt(elWidth,10)+parseInt(containerWidth,10))/parseInt(containerWidth,10)*o.duration;o.duration=parseInt(elWidth,10)/parseInt(containerWidth,10)*o.duration}else{o.duration=(parseInt(elWidth,10)+parseInt(containerWidth,10))/parseInt(containerWidth,10)*o.duration}}if(o.duplicated){o.duration=o.duration/2}if(o.allowCss3Support){var elm=document.body||document.createElement("div"),animationName="marqueeAnimation-"+Math.floor(Math.random()*1e7),domPrefixes="Webkit Moz O ms Khtml".split(" "),animationString="animation",animationCss3Str="",keyframeString="";if(elm.style.animation!==undefined){keyframeString="@keyframes "+animationName+" ";css3AnimationIsSupported=true}if(css3AnimationIsSupported===false){for(var i=0;i<domPrefixes.length;i++){if(elm.style[domPrefixes[i]+"AnimationName"]!==undefined){var prefix="-"+domPrefixes[i].toLowerCase()+"-";animationString=prefix+animationString;playState=prefix+playState;keyframeString="@"+prefix+"keyframes "+animationName+" ";css3AnimationIsSupported=true;break}}}if(css3AnimationIsSupported){animationCss3Str=animationName+" "+o.duration/1e3+"s "+o.delayBeforeStart/1e3+"s infinite "+o.css3easing;$this.data("css3AnimationIsSupported",true)}}var _rePositionVertically=function(){$marqueeWrapper.css("transform","translateY("+(o.direction==="up"?containerHeight+"px":"-"+elHeight+"px")+")")},_rePositionHorizontally=function(){$marqueeWrapper.css("transform","translateX("+(o.direction==="left"?containerWidth+"px":"-"+elWidth+"px")+")")};if(o.duplicated){if(verticalDir){if(o.startVisible){$marqueeWrapper.css("transform","translateY(0)")}else{$marqueeWrapper.css("transform","translateY("+(o.direction==="up"?containerHeight+"px":"-"+(elHeight*2-o.gap)+"px")+")")}}else{if(o.startVisible){$marqueeWrapper.css("transform","translateX(0)")}else{$marqueeWrapper.css("transform","translateX("+(o.direction==="left"?containerWidth+"px":"-"+(elWidth*2-o.gap)+"px")+")")}}if(!o.startVisible){loopCount=1}}else if(o.startVisible){loopCount=2}else{if(verticalDir){_rePositionVertically()}else{_rePositionHorizontally()}}var animate=function(){if(o.duplicated){if(loopCount===1){o._originalDuration=o.duration;if(verticalDir){o.duration=o.direction==="up"?o.duration+containerHeight/(elHeight/o.duration):o.duration*2}else{o.duration=o.direction==="left"?o.duration+containerWidth/(elWidth/o.duration):o.duration*2}if(animationCss3Str){animationCss3Str=animationName+" "+o.duration/1e3+"s "+o.delayBeforeStart/1e3+"s "+o.css3easing}loopCount++}else if(loopCount===2){o.duration=o._originalDuration;if(animationCss3Str){animationName=animationName+"0";keyframeString=$.trim(keyframeString)+"0 ";animationCss3Str=animationName+" "+o.duration/1e3+"s 0s infinite "+o.css3easing}loopCount++}}if(verticalDir){if(o.duplicated){if(loopCount>2){$marqueeWrapper.css("transform","translateY("+(o.direction==="up"?0:"-"+elHeight+"px")+")")}animationCss={transform:"translateY("+(o.direction==="up"?"-"+elHeight+"px":0)+")"}}else if(o.startVisible){if(loopCount===2){if(animationCss3Str){animationCss3Str=animationName+" "+o.duration/1e3+"s "+o.delayBeforeStart/1e3+"s "+o.css3easing}animationCss={transform:"translateY("+(o.direction==="up"?"-"+elHeight+"px":containerHeight+"px")+")"};loopCount++}else if(loopCount===3){o.duration=o._completeDuration;if(animationCss3Str){animationName=animationName+"0";keyframeString=$.trim(keyframeString)+"0 ";animationCss3Str=animationName+" "+o.duration/1e3+"s 0s infinite "+o.css3easing}_rePositionVertically()}}else{_rePositionVertically();animationCss={transform:"translateY("+(o.direction==="up"?"-"+$marqueeWrapper.height()+"px":containerHeight+"px")+")"}}}else{if(o.duplicated){if(loopCount>2){$marqueeWrapper.css("transform","translateX("+(o.direction==="left"?0:"-"+elWidth+"px")+")")}animationCss={transform:"translateX("+(o.direction==="left"?"-"+elWidth+"px":0)+")"}}else if(o.startVisible){if(loopCount===2){if(animationCss3Str){animationCss3Str=animationName+" "+o.duration/1e3+"s "+o.delayBeforeStart/1e3+"s "+o.css3easing}animationCss={transform:"translateX("+(o.direction==="left"?"-"+elWidth+"px":containerWidth+"px")+")"};loopCount++}else if(loopCount===3){o.duration=o._completeDuration;if(animationCss3Str){animationName=animationName+"0";keyframeString=$.trim(keyframeString)+"0 ";animationCss3Str=animationName+" "+o.duration/1e3+"s 0s infinite "+o.css3easing}_rePositionHorizontally()}}else{_rePositionHorizontally();animationCss={transform:"translateX("+(o.direction==="left"?"-"+elWidth+"px":containerWidth+"px")+")"}}}$this.trigger("beforeStarting");if(css3AnimationIsSupported){$marqueeWrapper.css(animationString,animationCss3Str);var keyframeCss=keyframeString+" { 100%  "+_objToString(animationCss)+"}",$styles=$marqueeWrapper.find("style");if($styles.length!==0){$styles.filter(":last").html(keyframeCss)}else{$("head").append("<style>"+keyframeCss+"</style>")}_prefixedEvent($marqueeWrapper[0],"AnimationIteration",function(){$this.trigger("finished")});_prefixedEvent($marqueeWrapper[0],"AnimationEnd",function(){animate();$this.trigger("finished")})}else{$marqueeWrapper.animate(animationCss,o.duration,o.easing,function(){$this.trigger("finished");if(o.pauseOnCycle){_startAnimationWithDelay()}else{animate()}})}$this.data("runningStatus","resumed")};$this.on("pause",methods.pause);$this.on("resume",methods.resume);if(o.pauseOnHover){$this.on("mouseenter",methods.pause);$this.on("mouseleave",methods.resume)}if(css3AnimationIsSupported&&o.allowCss3Support){animate()}else{_startAnimationWithDelay()}})};$.fn.marquee.defaults={allowCss3Support:true,css3easing:"linear",easing:"linear",delayBeforeStart:1e3,direction:"left",duplicated:false,duration:5e3,speed:0,gap:20,pauseOnCycle:false,pauseOnHover:false,startVisible:false}});
