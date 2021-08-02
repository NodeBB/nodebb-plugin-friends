<div class="account">
	<!-- IMPORT partials/account/header.tpl -->

	<div class="users row">

		<h4>[[plugin-friends:pending-friends]]</h4>
		<ul class="users-container pending-friends clearfix">
			<!-- BEGIN pendingFriends -->
			<li class="col-xs-2 registered-user users-box">
				<a class="h2w-friend-link" href="{config.relative_path}/user/{pendingFriends.userslug}">
					<!-- IF ../picture -->
					<img src="{pendingFriends.picture}" />
					<!-- ELSE -->
					<div class="avatar avatar-sm" style="background-color: {../icon:bgColor};">{../icon:text}</div>
					<!-- ENDIF ../picture -->
				</a><br />
				<a class="h2w-friend-link" href="{config.relative_path}/user/{pendingFriends.userslug}">{pendingFriends.username}</a><br />

				<button class="btn btn-sm btn-success friend-button btn-block" data-uid="{pendingFriends.uid}" data-type="accept">[[plugin-friends:pending-friends.accept]]</button>
				<button class="btn btn-sm btn-warning friend-button btn-block" data-uid="{pendingFriends.uid}" data-type="reject">[[plugin-friends:pending-friends.reject]]</button>
			</li>
			<!-- END pendingFriends -->
		</ul>
		<!-- IF !pendingFriends.length -->
		<div class="alert alert-warning">[[plugin-friends:pending-friends.no-requests]]</div>
		<!-- ENDIF !pendingFriends.length -->

		<hr />

		<h4>[[plugin-friends:friends]]</h4>
		<ul id="users-container" class="users-container clearfix" data-nextstart="{nextStart}">
			<!-- IMPORT partials/users_list.tpl -->
		</ul>


		<!-- IF !users.length -->
		<div class="alert alert-warning">[[plugin-friends:friends.not-found]]</div>
		<!-- ENDIF !users.length -->

		<!-- IMPORT partials/paginator.tpl -->
	</div>
</div>

