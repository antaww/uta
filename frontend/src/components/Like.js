import React, {useState} from 'react';
import axios from 'axios';

function Track({track}) {
	const [liked, setLiked] = useState(false);

	const handleLikeToggle = () => {
		const route = liked ? '/unlike' : '/like';
		axios.post(route, {track_id: track.id}, {withCredentials: true})
			.then(response => {
				console.log(response);
				setLiked(!liked);
			})
			.catch(err => {
				console.error(err);
			});
	};

	return (
		<td>
			<button className={`btn btn-sm ${liked ? 'btn-danger' : 'btn-success'}`} onClick={handleLikeToggle}>
				{liked ? 'Unlike' : 'Like'}
			</button>
		</td>
	);
}

export default Track;