document.addEventListener('DOMContentLoaded', function() {
    const username = profileUser; // Esta variable se establece en el servidor

    console.log('Cargando perfil de usuario:', username); // Verifica que el usuario se está obteniendo

    cargarPerfilUsuario(username);
    cargarPublicacionesDeUsuario(username);
});

function cargarPerfilUsuario(username) {
    $.ajax({
        type: 'GET',
        url: `/perfil-data/${username}`,
        success: function (response) {
            console.log('Perfil data:', response); // Verifica los datos en la consola
            if (response) {
                $('#nick_usuario').text(response.username);
                $('#publicaciones').text(`${response.publicaciones} publicaciones`);
                $('#seguidores').text(`${response.seguidores} seguidores`);
                $('#seguidos').text(`${response.seguidos} seguidos`);
                if (response.imagenPerfil) {
                    $('#fotoperfil').attr('src', response.imagenPerfil);
                } else {
                    $('#fotoperfil').attr('src', 'images/default-profile.png'); // Imagen de perfil predeterminada
                }

                // Compara el usuario actual con el usuario del perfil
                console.log(response.currentUser);
                console.log(response.username);
                if(response.currentUser === response.username) {
                    // Ocultar el botón de seguir si es el mismo usuario
                    $('#btnSeguir').hide();
                } else {
                    // Configurar el botón de seguir/dejar de seguir
                    const followButton = $('#btnSeguir');
                    if (response.isFollowing) {
                        followButton.text('Dejar de seguir').removeClass('btn-seguir').addClass('btn-dejar-seguir');
                    } else {
                        followButton.text('Seguir').removeClass('btn-dejar-seguir').addClass('btn-seguir');
                    }
                    followButton.off('click').on('click', function() {
                        toggleSeguir(username);
                    });
                    $('#btnSeguir').show();
                }
            } else {
                console.error('Error al cargar el perfil del usuario.');
            }
        },
        error: function (error) {
            console.error('Error al cargar el perfil del usuario:', error);
        }
    });
}


function toggleSeguir(username) {
    $.ajax({
        type: 'POST',
        url: '/toggle-seguir',
        data: JSON.stringify({ username: username }),
        contentType: 'application/json',
        success: function (response) {
            if (response.followed) {
                $('#btnSeguir').text('Dejar de seguir').removeClass('btn-seguir').addClass('btn-dejar-seguir');
            } else {
                $('#btnSeguir').text('Seguir').removeClass('btn-dejar-seguir').addClass('btn-seguir');
            }
        },
        error: function (error) {
            console.error('Error al seguir/dejar de seguir al usuario:', error);
        }
    });
}
function cargarPublicacionesDeUsuario(username) {
    $.ajax({
        type: 'GET',
        url: `/publicaciones-de-usuario/${username}`,
        success: function (response) {
            console.log('Publicaciones data:', response);
            if (response && response.publicaciones && response.publicaciones.length > 0) {
                var galeria = $('#galeria');
                galeria.empty();

                $.each(response.publicaciones, function(index, publicacion) {
                    const imgContainer = $('<div>', {
                        'class': 'col-md-4 col-sm-6 image-container',
                        'data-publicacion-id': publicacion._id
                    });

                    var imgElement = $('<img>', {
                        src: `/${publicacion.imagePath}`,
                        'class': 'galeria-img',
                        'click': function() {
                            $('#modalImage').attr('src', `/${publicacion.imagePath}`).data('publicacion-id', publicacion._id);
                            $('#modalUserProfilePic').attr('src', `/${publicacion.imagenPerfil}`);
                            $('#modalUserProfileLink').attr('href', `/perfil/${publicacion.username}`).text(`@${publicacion.username}`);
                            $('#modalDescription').html(`<strong>${publicacion.username}</strong> ${publicacion.descripcion}`);
                            $('#modalComments').empty();
                            $.each(publicacion.comentarios, function(index, comentario) {
                                var commentElement = $('<div>', {
                                    'class': 'comment',
                                    'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
                                });
                                $('#modalComments').append(commentElement);
                            });
                            $('#modalCommentBox').val('');
                            showLike(publicacion._id).then(likeButtonHtml => {
                                $('#modalLikeButton').html(likeButtonHtml);
                                $('#modalLikeButton').off('click').on('click', function() {
                                    toggleLike(publicacion._id);
                                });
                            });

                            $('#modalCommentSubmitButton').off('click').on('click', function() {
                                var comentarioTexto = $('#modalCommentBox').val();
                                if (comentarioTexto) {
                                    addComment(publicacion._id, comentarioTexto);
                                    $('#modalCommentBox').val('');
                                }
                            });

                            $('#imageModal').modal('show');
                        }
                    });

                    var likesLabel = $('<div>', {
                        'class': 'likes-label',
                        'text': `${publicacion.meGustas.length} Me gusta`
                    });

                    showLike(publicacion._id).then(likeButtonHtml => {
                        var likeButton = $('<button>', {
                            'class': 'like-button',
                            'html': likeButtonHtml,
                            'click': function() {
                                toggleLike(publicacion._id);
                            }
                        });

                        var commentButton = $('<button>', {
                            'class': 'comment-button',
                            'text': 'Comentar',
                            'click': function() {
                                var comentarioTexto = prompt('Introduce tu comentario:');
                                if (comentarioTexto) {
                                    addComment(publicacion._id, comentarioTexto);
                                }
                            }
                        });

                        var commentsContainer = $('<div>', {
                            'class': 'comments-container'
                        });

                        // Mostrar solo los dos primeros comentarios en la página principal
                        var comentariosMostrados = publicacion.comentarios.slice(0, 2);
                        $.each(comentariosMostrados, function(index, comentario) {
                            var commentElement = $('<div>', {
                                'class': 'comment',
                                'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
                            });
                            commentsContainer.append(commentElement);
                        });

                        // Si hay más de dos comentarios, añadir botón "Ver más"
                        if (publicacion.comentarios.length > 2) {
                            var verMasButton = $('<button>', {
                                'class': 'ver-mas-button',
                                'text': 'Ver más',
                                'click': function() {
                                    $('#modalImage').attr('src', `/${publicacion.imagePath}`).data('publicacion-id', publicacion._id);
                                    $('#modalUserProfilePic').attr('src', `/${publicacion.imagenPerfil}`);
                                    $('#modalUserProfileLink').attr('href', `/perfil/${publicacion.username}`).text(`@${publicacion.username}`);
                                    $('#modalDescription').html(`<strong>${publicacion.username}</strong> ${publicacion.descripcion}`);
                                    $('#modalComments').empty();
                                    $.each(publicacion.comentarios, function(index, comentario) {
                                        var commentElement = $('<div>', {
                                            'class': 'comment',
                                            'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
                                        });
                                        $('#modalComments').append(commentElement);
                                    });
                                    $('#modalCommentBox').val('');
                                    showLike(publicacion._id).then(likeButtonHtml => {
                                        $('#modalLikeButton').html(likeButtonHtml);
                                        $('#modalLikeButton').off('click').on('click', function() {
                                            toggleLike(publicacion._id);
                                        });
                                    });

                                    $('#modalCommentSubmitButton').off('click').on('click', function() {
                                        var comentarioTexto = $('#modalCommentBox').val();
                                        if (comentarioTexto) {
                                            addComment(publicacion._id, comentarioTexto);
                                            $('#modalCommentBox').val('');
                                        }
                                    });

                                    $('#imageModal').modal('show');
                                }
                            });
                            commentsContainer.append(verMasButton);
                        }

                        var commentBox = $('<textarea>', {
                            'class': 'comment-box',
                            'placeholder': 'Añade un comentario...'
                        });

                        var commentSubmitButton = $('<button>', {
                            'class': 'comment-submit-button',
                            'click': function() {
                                var comentarioTexto = commentBox.val();
                                if (comentarioTexto) {
                                    addComment(publicacion._id, comentarioTexto);
                                }
                            }
                        });

                        var submitButtonImage = $('<img>', {
                            'src': '/images/enviar.png',
                            'alt': 'Enviar',
                            'class': 'submit-button-image'
                        });

                        commentSubmitButton.append(submitButtonImage);

                        var commentContainer = $('<div>', {
                            'class': 'comment-container'
                        });

                        commentContainer.append(commentBox).append(commentSubmitButton);

                        imgContainer.append(imgElement.addClass('galeria-img'))
                            .append(likesLabel)
                            .append(likeButton)
                            .append(commentButton)
                            .append(commentsContainer)
                            .append(commentContainer);

                        galeria.append(imgContainer);
                    }).catch(error => {
                        console.error('Error al obtener el botón de me gusta:', error);
                    });
                });

            } else {
                console.log('El usuario no tiene imágenes.');
            }
        },
        error: function (error) {
            console.error('Error al cargar las imágenes del usuario:', error);
        }
    });
}




function showLike(publicacionId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: '/me-gusta-o-no',
            data: JSON.stringify({ publicacionId: publicacionId }),
            contentType: 'application/json',
            success: function(response) {
                var likeButtonHtml;
                if (response.status) {
                    likeButtonHtml = '<img src="/images/me-gusta.png" alt="Me gusta">';
                } else {
                    likeButtonHtml = '<img src="/images/me-gusta2.png" alt="Me gusta">';
                }

                // Actualizar el botón de "me gusta" en el perfil
                var publicacionContainer = $(`[data-publicacion-id="${publicacionId}"]`);
                var likeButton = publicacionContainer.find('.like-button');
                //var likesLabel = publicacionContainer.find('.likes-label');

                likeButton.html(likeButtonHtml);
                //likesLabel.text(`${response.likesCount} Me gusta`);

                likeButton.off('click').on('click', function() {
                    toggleLike(publicacionId);
                });

                // Actualizar el botón de "me gusta" en el modal si está visible
                if ($('#imageModal').hasClass('show') && $('#modalImage').data('publicacion-id') === publicacionId) {
                    var modalLikeButton = $('#modalLikeButton');
                    //var modalLikesLabel = $('#modalLikesLabel');

                    modalLikeButton.html(likeButtonHtml);
                    //modalLikesLabel.text(`${response.likesCount} Me gusta`);

                    modalLikeButton.off('click').on('click', function() {
                        toggleLike(publicacionId);
                    });
                }

                resolve(likeButtonHtml);
            },
            error: function(error) {
                console.error('Error al verificar "me gusta":', error);
                reject(error);
            }
        });
    });
}
function toggleLike(publicacionId) {
    $.ajax({
        type: 'POST',
        url: '/me-gusta',
        data: JSON.stringify({ publicacionId: publicacionId }),
        contentType: 'application/json',
        success: function(response) {
            if (response && response.likesCount !== undefined) {
                var publicacionContainer = $(`[data-publicacion-id="${publicacionId}"]`);
                var likesLabel = publicacionContainer.find('.likes-label');
                likesLabel.text(`${response.likesCount} Me gusta`);
            }
            showLike(publicacionId);
        },
        error: function(error) {
            console.error('Error al gestionar "me gusta":', error);
        }
    });
}
function addLike(publicacionId) {
    $.ajax({
        type: 'POST',
        url: '/me-gusta',
        data: JSON.stringify({ publicacionId: publicacionId }),
        contentType: 'application/json',
        success: function(response) {
            alert(response.message);
            cargarPublicacionesDeUsuario(profileUser); // Recargar las publicaciones para actualizar el número de "me gusta"
        },
        error: function(error) {
            console.error('Error al añadir "me gusta":', error);
        }
    });
}

function addComment(publicacionId, texto) {
    $.ajax({
        type: 'POST',
        url: '/comentario',
        data: JSON.stringify({ publicacionId: publicacionId, texto: texto }),
        contentType: 'application/json',
        success: function(response) {
            var comentario = {
                usuario: response.usuario,
                texto: texto,
                fecha: new Date()
            };
            renderComment(publicacionId, comentario);
            $(`[data-publicacion-id="${publicacionId}"] .comment-box`).val('');
            $('#modalCommentBox').val('');
        },
        error: function(error) {
            console.error('Error al añadir comentario:', error);
        }
    });
}

function renderComment(publicacionId, comentario) {
    var publicacionContainer = $(`[data-publicacion-id="${publicacionId}"]`);
    var commentsContainer = publicacionContainer.find('.comments-container');

    var commentElement = $('<div>', {
        'class': 'comment',
        'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
    });

    // Añadir el comentario al contenedor
    commentsContainer.append(commentElement);

    // Obtener todos los comentarios existentes
    var existingComments = commentsContainer.children('.comment');

    // Mostrar solo los primeros dos comentarios y el botón "Ver más" si hay más de dos
    if (existingComments.length > 2) {
        existingComments.slice(2).hide();

        var verMasButton = commentsContainer.find('.ver-mas-button');
        if (verMasButton.length === 0) {
            verMasButton = $('<button>', {
                'class': 'ver-mas-button',
                'text': 'Ver más',
                'click': function() {
                    // Abrir el modal con todos los comentarios
                    $('#imageModal').modal('show');
                }
            });
            commentsContainer.append(verMasButton);
        }
    } else {
        commentsContainer.find('.ver-mas-button').remove();
    }

    // Actualizar el modal si está visible y corresponde a la publicación actual
    if ($('#imageModal').hasClass('show') && $('#modalImage').data('publicacion-id') === publicacionId) {
        updateModalComments(publicacionId, comentario);
    }
}

function updateModalComments(publicacionId, comentario) {
    var modalCommentsContainer = $('#modalComments');

    var modalCommentElement = $('<div>', {
        'class': 'comment',
        'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
    });

    modalCommentsContainer.append(modalCommentElement);
}

function subirImagen() {
    const fileInput = document.getElementById('inputImagen');
    const descripcion = document.getElementById('inputDescripcion');
    //AÑADO CATEGORIA
    const categoriaInput = document.getElementById('categoria');
    const formData = new FormData();
    formData.append('imagen', fileInput.files[0]);
    formData.append('descripcion', descripcion.value); 
    formData.append('categoria', categoriaInput.value);


    $.ajax({
        type: 'POST',
        url: '/upload',
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
            console.log('Imagen subida correctamente');
            console.log('Ruta de la imagen:', response.imagePath);
            alert('Imagen subida correctamente');

            // Cerrar el modal después de la subida exitosa
            $('#uploadModal').modal('hide');
            cargarPublicacionesUsuario();
            cargarPerfil(); // Actualizar datos del perfil después de subir la imagen
        },
        error: function (error) {
            console.error('Error al subir la imagen:', error);
        }
    });
}