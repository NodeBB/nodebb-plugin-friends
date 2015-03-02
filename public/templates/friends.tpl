
<!-- IMPORT partials/account_menu.tpl -->

<div class="users account">

	<h4>Pending Friends</h4>
	<ul class="users-container pending-friends clearfix">
		<!-- BEGIN pendingFriends -->
		<li class="col-xs-2 registered-user">
			<a class="h2w-friend-link" href="http://stg.h2-atkins.com/client/#/social/{pendingFriends.userslug}/profile"><img src="{pendingFriends.picture}" /></a><br />
			<a class="h2w-friend-link" href="http://stg.h2-atkins.com/client/#/social/{pendingFriends.userslug}/profile">{pendingFriends.username}</a><br />
			
			<button class="btn btn-success friend-button" data-uid="{pendingFriends.uid}" data-type="accept">Accept Friend Request</button>
			<button class="btn btn-warning friend-button" data-uid="{pendingFriends.uid}" data-type="reject">Reject Friend Request</button>
		</li>
		<!-- END pendingFriends -->
	</ul>
	<!-- IF !pendingFriends.length -->
	<div class="alert alert-warning">No pending friend requests</div>
	<!-- ENDIF !pendingFriends.length -->

	<h4>Friends</h4>
	<ul id="users-container" class="users-container clearfix" data-nextstart="{nextStart}">
		<!-- IMPORT partials/users_list.tpl -->
	</ul>


	<!-- IF !users.length -->
	<div class="alert alert-warning">No friends</div>
	<!-- ENDIF !users.length -->
</div>

