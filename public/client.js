'use strict';

$(document).ready(function () {
	$(window).on('action:ajaxify.end', function () {
		$('#users-container, .pending-friends').on('click', '.friend-button', addFriendFunctionality);
	});

	$(window).on('action:ajaxify.contentLoaded', function (ev, data) {
		if (data.tpl === 'account') {
			var uid = $('[data-uid]').attr('data-uid');

			socket.emit('plugins.friends.areFriendsOrRequested', { uid: uid }, function (err, isFriend) {
				if (err) {
					console.error('[plugins/friends]', err);
				}

				if (isFriend[0]) {
					$('<button class="btn btn-link btn-sm friend-button" data-uid="' + uid + '" data-type="unfriend"></button>')
						.translateText('[[plugin-friends:action.remove-friend]]')
						.insertAfter($('#follow-btn'));
				} else {
					$('<button class="btn btn-warning btn-sm friend-button" data-uid="' + uid + '" data-type="friend"></button>')
						.translateText('[[plugin-friends:action.add-friend]]')
						.insertAfter($('#follow-btn'));
				}

				$('.friend-button').on('click', addFriendFunctionality);
			});
		}
	});

	function addFriendFunctionality() {
		var $this = $(this);
		friendCommand($this.attr('data-type'), $this.attr('data-uid'), $this);
	}

	function friendCommand(type, uid, btn) {
		socket.emit('plugins.friends.' + type, {
			uid: uid,
		}, function (err) {
			if (err) {
				return app.alertError(err.message);
			}

			switch (type) {
				case 'friend':
					btn.attr('data-type', '').prop('disabled', true).translateText('[[plugin-friends:action.request-sent]]');
					break;
				case 'unfriend':
					btn.attr('data-type', 'friend')
						.addClass('btn-warning').removeClass('btn-link').translateText('[[plugin-friends:action.add-friend]]');
					break;
				case 'accept':
					ajaxify.go('user/' + app.user.userslug + '/friends');
					break;
				case 'reject':
					btn.parents('.registered-user').remove();
					break;
			}
		});
		return false;
	}
});
