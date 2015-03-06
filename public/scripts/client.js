

$(document).ready(function() {

	$(window).on('action:ajaxify.end', function(ev, data) {
		$('#users-container, .pending-friends').on('click', '.friend-button', addFriendFunctionality);
	});

	$(window).on('action:ajaxify.contentLoaded', function(ev, data) {
		if (data.url.match(/user\//)) {
			var uid = $('[data-uid]').attr('data-uid');
			$('#follow-btn').hide();

			socket.emit('plugins.friends.areFriendsOrRequested', {uid: uid}, function(err, isFriend) {
				if (isFriend[0]) {
					$('#follow-btn').after(' <button class="btn btn-link btn-sm friend-button" data-uid="' + uid + '" data-type="unfriend">Remove Friend</button>');
				} else {
					$('#follow-btn').after(' <button class="btn btn-warning btn-sm friend-button" data-uid="' + uid + '" data-type="friend">Add Friend</button>');
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
			uid: uid
		}, function(err) {
			if (err) {
				return app.alertError(err.message);
			}

			if (type === 'friend') {
				btn.attr('data-type', 'unfriend')
					.removeClass('btn-warning').addClass('btn-link').html('Remove Friend');
			} else if (type === 'unfriend') {
				btn.attr('data-type', 'friend')
					.addClass('btn-warning').removeClass('btn-link').html('Add Friend');
			} else if (type === 'accept') {
				ajaxify.go('user/' + app.user.userslug + '/friends');
			} else if (type === 'reject') {
				btn.parents('.registered-user').remove();
			}
		});
		return false;
	}
})