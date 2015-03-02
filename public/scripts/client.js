

$(document).ready(function() {

	$(window).on('action:ajaxify.end', function(ev, data) {
		
		$('#users-container, .pending-friends').on('click', '.friend-button', function() {
			var $this = $(this);
			friendCommand($this.attr('data-type'), $this.attr('data-uid'), $this);
		});

	});

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